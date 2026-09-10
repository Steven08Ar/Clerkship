from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app import db, get_mongo_db
from app.models import User
from app.schemas import StorageUsageResponse, UpdateUserRequest, UserResponse, UserSummary, validate_body
from app.utils import get_current_user

usuarios_bp = Blueprint("usuarios", __name__)

STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024  # 5 GB


@usuarios_bp.get("/uso-almacenamiento")
@jwt_required()
def uso_almacenamiento():
    user = get_current_user()
    mongo = get_mongo_db()
    uid = str(user.id)

    documentos_bytes = next(
        mongo.documents.aggregate([
            {"$match": {"owner_user_id": uid}},
            {"$group": {"_id": None, "total": {"$sum": {"$ifNull": ["$size_bytes", 0]}}}},
        ]),
        {},
    ).get("total", 0)

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
        return jsonify({
            "error": "Bad Request",
            "message": "El parámetro de búsqueda 'q' es requerido",
            "status_code": 400
        }), 400

    users = User.query.filter(User.username.ilike(f"{q}%")).limit(20).all()
    user_list = [
        {
            "id": str(u.id),
            "username": u.username,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "role": u.role,
        }
        for u in users
    ]
    return jsonify(user_list), 200


@usuarios_bp.get("/<user_id>")
@jwt_required()
def obtener(user_id):
    user = User.query.get(user_id)
    if user is None:
        return jsonify({
            "error": "Not Found",
            "message": "Usuario no encontrado",
            "status_code": 404
        }), 404
    return jsonify(user.to_dict()), 200


@usuarios_bp.patch("/me")
@jwt_required()
@validate_body(UpdateUserRequest)
def actualizar_me(validated_body: UpdateUserRequest):
    user = get_current_user()

    if validated_body.first_name and validated_body.first_name.strip():
        user.first_name = validated_body.first_name.strip()
    if validated_body.last_name and validated_body.last_name.strip():
        user.last_name = validated_body.last_name.strip()

    db.session.commit()
    return jsonify(user.to_dict()), 200
