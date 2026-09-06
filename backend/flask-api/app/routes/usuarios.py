from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app import db, get_mongo_db
from app.models import User
from app.utils import get_current_user

usuarios_bp = Blueprint("usuarios", __name__)

# Limite "de cara al usuario" — cosmetico/profesional para la tarjeta del
# Dashboard. El limite real de la base compartida (MongoDB Atlas M0, 512MB
# para TODOS los usuarios) es mucho mas chico; esto no lo hace cumplir nada
# en el backend, solo se muestra como referencia.
STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024  # 5 GB


@usuarios_bp.get("/uso-almacenamiento")
@jwt_required()
def uso_almacenamiento():
    # Solo Documentos — Chats y Buzon (que tambien guardaban bytes en Mongo,
    # como adjuntos de mensajes y de correos) se archivaron, ver
    # archivado_buzon_chats/ en la raiz del repo.
    user = get_current_user()
    mongo = get_mongo_db()
    uid = str(user.id)

    documentos_bytes = next(mongo.documents.aggregate([
        {"$match": {"owner_user_id": uid}},
        {"$group": {"_id": None, "total": {"$sum": {"$ifNull": ["$size_bytes", 0]}}}},
    ]), {}).get("total", 0)

    used_bytes = int(documentos_bytes)

    return jsonify({
        "used_bytes": used_bytes,
        "limit_bytes": STORAGE_LIMIT_BYTES,
        "breakdown": {
            "documentos": int(documentos_bytes),
        },
    }), 200


@usuarios_bp.get("/buscar")
@jwt_required()
def buscar():
    q = (request.args.get("q") or "").strip().lstrip("@")
    if not q:
        return jsonify({"error": "Parámetro q es requerido"}), 400

    users = User.query.filter(User.username.ilike(f"{q}%")).limit(20).all()
    return jsonify({"users": [u.to_dict() for u in users]}), 200


@usuarios_bp.get("/<user_id>")
@jwt_required()
def obtener(user_id):
    user = User.query.get(user_id)
    if user is None:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify({"user": user.to_dict()}), 200


@usuarios_bp.patch("/me")
@jwt_required()
def actualizar_me():
    user = get_current_user()
    data = request.get_json(silent=True) or {}

    if "first_name" in data and data["first_name"].strip():
        user.first_name = data["first_name"].strip()
    if "last_name" in data and data["last_name"].strip():
        user.last_name = data["last_name"].strip()

    db.session.commit()
    return jsonify({"user": user.to_dict()}), 200
