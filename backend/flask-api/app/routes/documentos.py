"""
Carpetas y documentos reales del Dashboard.

Mismo patrón ya usado en Chats/Buzón: la carpeta (quién es dueño, nombre,
color) vive en Postgres (`document_folders`); el archivo en sí (bytes +
metadata) vive en Mongo (colección `documents`) como base64 — no hay bucket
de almacenamiento conectado todavía.
"""
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app import db, get_mongo_db
from app.models import DocumentFolder
from app.schemas import (
    CreateFolderRequest,
    DocumentFileResponse,
    DocumentFolderResponse,
    UpdateFolderRequest,
    UploadDocumentRequest,
    validate_body,
)
from app.utils import get_current_user

documentos_bp = Blueprint("documentos", __name__)

MAX_DOCUMENT_BASE64_CHARS = 15 * 1024 * 1024  # ~11MB reales por documento


def _extension_of(name: str) -> str:
    """".pdf" de "informe.pdf", o "" si no tiene punto — mismo criterio que
    splitExtension() en el frontend."""
    dot = name.rfind(".")
    return name[dot:] if dot > 0 else ""


def _folder_dict_with_counts(folder: DocumentFolder, counts: dict, subfolder_counts: dict = None) -> dict:
    d = folder.to_dict()
    info = counts.get(str(folder.id), {"files": 0, "size_bytes": 0})
    d["file_count"] = info["files"]
    d["total_size_bytes"] = info["size_bytes"]
    d["subfolder_count"] = (subfolder_counts or {}).get(str(folder.id), 0)
    return d


def _document_dict(doc, include_data: bool = False) -> dict:
    d = {
        "id": str(doc["_id"]),
        "folder_id": doc.get("folder_id"),
        "name": doc.get("name"),
        "mime_type": doc.get("mime_type"),
        "size_bytes": doc.get("size_bytes", 0),
        "created_at": doc["created_at"].replace(tzinfo=timezone.utc).isoformat() if doc.get("created_at") else None,
    }
    if include_data:
        d["data"] = doc.get("data")
    return d


def _descendant_ids(user_id, root_id: str) -> list:
    """IDs de todas las subcarpetas (a cualquier profundidad) de root_id, sin incluirlo."""
    all_folders = DocumentFolder.query.filter_by(owner_user_id=user_id).all()
    children_of: dict = {}
    for f in all_folders:
        parent = str(f.parent_folder_id) if f.parent_folder_id else None
        children_of.setdefault(parent, []).append(str(f.id))

    result = []
    stack = list(children_of.get(root_id, []))
    while stack:
        fid = stack.pop()
        result.append(fid)
        stack.extend(children_of.get(fid, []))
    return result


@documentos_bp.get("/carpetas")
@jwt_required()
def listar_carpetas():
    user = get_current_user()
    if not user:
        return jsonify({
            "error": "Not Found",
            "message": "Usuario no encontrado",
            "status_code": 404
        }), 404

    folders = DocumentFolder.query.filter_by(owner_user_id=user.id).order_by(DocumentFolder.created_at.asc()).all()

    counts = {}
    try:
        pipeline = [
            {"$match": {"owner_user_id": str(user.id)}},
            {"$group": {"_id": "$folder_id", "files": {"$sum": 1}, "size_bytes": {"$sum": "$size_bytes"}}},
        ]
        counts = {
            (doc["_id"] or ""): {"files": doc["files"], "size_bytes": doc["size_bytes"]}
            for doc in get_mongo_db().documents.aggregate(pipeline)
        }
    except Exception:
        counts = {}

    subfolder_counts: dict = {}
    for f in folders:
        if f.parent_folder_id:
            key = str(f.parent_folder_id)
            subfolder_counts[key] = subfolder_counts.get(key, 0) + 1

    return jsonify({"folders": [_folder_dict_with_counts(f, counts, subfolder_counts) for f in folders]}), 200


@documentos_bp.post("/carpetas")
@jwt_required()
@validate_body(CreateFolderRequest)
def crear_carpeta(validated_body: CreateFolderRequest):
    user = get_current_user()
    name = validated_body.name.strip()
    color = (validated_body.color or "#10B981").strip()

    data = request.get_json(silent=True) or {}
    parent_folder_id = data.get("parent_folder_id")

    if parent_folder_id:
        parent = DocumentFolder.query.filter_by(id=parent_folder_id, owner_user_id=user.id).first()
        if parent is None:
            return jsonify({
                "error": "Not Found",
                "message": "Carpeta padre no encontrada",
                "status_code": 404
            }), 404

    folder = DocumentFolder(owner_user_id=user.id, name=name, color=color, parent_folder_id=parent_folder_id or None)
    db.session.add(folder)
    db.session.commit()

    return jsonify({"folder": _folder_dict_with_counts(folder, {}), **_folder_dict_with_counts(folder, {})}), 201


@documentos_bp.patch("/carpetas/<folder_id>")
@jwt_required()
@validate_body(UpdateFolderRequest)
def actualizar_carpeta(folder_id, validated_body: UpdateFolderRequest):
    user = get_current_user()
    folder = DocumentFolder.query.filter_by(id=folder_id, owner_user_id=user.id).first()
    if folder is None:
        return jsonify({
            "error": "Not Found",
            "message": "Carpeta no encontrada",
            "status_code": 404
        }), 404

    if validated_body.name:
        folder.name = validated_body.name.strip()
    if validated_body.color:
        folder.color = validated_body.color.strip()

    data = request.get_json(silent=True) or {}
    if "parent_folder_id" in data:
        parent_folder_id = data["parent_folder_id"]
        if parent_folder_id:
            if parent_folder_id == str(folder.id):
                return jsonify({
                    "error": "Bad Request",
                    "message": "Una carpeta no puede ser su propia carpeta padre",
                    "status_code": 400
                }), 400
            parent = DocumentFolder.query.filter_by(id=parent_folder_id, owner_user_id=user.id).first()
            if parent is None:
                return jsonify({
                    "error": "Not Found",
                    "message": "Carpeta padre no encontrada",
                    "status_code": 404
                }), 404
            if parent_folder_id in _descendant_ids(user.id, str(folder.id)):
                return jsonify({
                    "error": "Bad Request",
                    "message": "No se puede mover una carpeta dentro de su propia subcarpeta",
                    "status_code": 400
                }), 400
        folder.parent_folder_id = parent_folder_id or None

    folder.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    counts = {}
    try:
        counts_pipeline = [
            {"$match": {"owner_user_id": str(user.id), "folder_id": str(folder.id)}},
            {"$group": {"_id": "$folder_id", "files": {"$sum": 1}, "size_bytes": {"$sum": "$size_bytes"}}},
        ]
        counts = {
            (doc["_id"] or ""): {"files": doc["files"], "size_bytes": doc["size_bytes"]}
            for doc in get_mongo_db().documents.aggregate(counts_pipeline)
        }
    except Exception:
        counts = {}
    return jsonify({"folder": _folder_dict_with_counts(folder, counts)}), 200


@documentos_bp.delete("/carpetas/<folder_id>")
@jwt_required()
def borrar_carpeta(folder_id):
    user = get_current_user()
    folder = DocumentFolder.query.filter_by(id=folder_id, owner_user_id=user.id).first()
    if folder is None:
        return jsonify({"error": "Carpeta no encontrada"}), 404

    folder_ids = [str(folder.id)] + _descendant_ids(user.id, str(folder.id))
    deleted_count = 0
    try:
        result = get_mongo_db().documents.delete_many({"owner_user_id": str(user.id), "folder_id": {"$in": folder_ids}})
        deleted_count = result.deleted_count
    except Exception:
        deleted_count = 0
    db.session.delete(folder)
    db.session.commit()

    return jsonify({"ok": True, "documents_deleted": deleted_count}), 200


@documentos_bp.get("/documentos")
@documentos_bp.get("/archivos")
@jwt_required()
def listar_documentos():
    user = get_current_user()
    folder_id = request.args.get("folder_id")
    limit = min(int(request.args.get("limit", 100)), 300)

    query: dict = {"owner_user_id": str(user.id)}
    if folder_id:
        query["folder_id"] = folder_id

    docs = list(
        get_mongo_db()
        .documents.find(query)
        .sort("created_at", -1)
        .limit(limit)
    )
    return jsonify({"documents": [_document_dict(d) for d in docs]}), 200


@documentos_bp.post("/documentos")
@documentos_bp.post("/archivos")
@jwt_required()
@validate_body(UploadDocumentRequest)
def subir_documento(validated_body: UploadDocumentRequest):
    user = get_current_user()
    name = validated_body.name.strip()
    mime_type = (validated_body.mime_type or "application/octet-stream").strip()
    file_data = validated_body.get_content()
    folder_id = validated_body.folder_id

    if not file_data:
        return jsonify({
            "error": "Bad Request",
            "message": "Se requiere el contenido del archivo en 'file_base64' o 'data'",
            "status_code": 400
        }), 400

    if len(file_data) > MAX_DOCUMENT_BASE64_CHARS:
        return jsonify({
            "error": "Payload Too Large",
            "message": "El documento es demasiado pesado",
            "status_code": 413
        }), 413

    if folder_id:
        folder = DocumentFolder.query.filter_by(id=folder_id, owner_user_id=user.id).first()
        if folder is None:
            return jsonify({
                "error": "Not Found",
                "message": "Carpeta no encontrada",
                "status_code": 404
            }), 404

    data = request.get_json(silent=True) or {}
    doc = {
        "owner_user_id": str(user.id),
        "folder_id": folder_id,
        "name": name,
        "mime_type": mime_type,
        "size_bytes": data.get("size_bytes") or int(len(file_data) * 3 / 4),
        "data": file_data,
        "created_at": datetime.now(timezone.utc),
    }
    result = get_mongo_db().documents.insert_one(doc)
    doc["_id"] = result.inserted_id

    return jsonify({"document": _document_dict(doc), **_document_dict(doc)}), 201


@documentos_bp.get("/documentos/<document_id>")
@documentos_bp.get("/archivos/<document_id>")
@jwt_required()
def obtener_documento(document_id):
    user = get_current_user()
    try:
        oid = ObjectId(document_id)
    except InvalidId:
        return jsonify({"error": "id inválido"}), 400

    doc = get_mongo_db().documents.find_one({"_id": oid, "owner_user_id": str(user.id)})
    if doc is None:
        return jsonify({"error": "Documento no encontrado"}), 404

    return jsonify({"document": _document_dict(doc, include_data=True)}), 200


@documentos_bp.patch("/documentos/<document_id>")
@documentos_bp.patch("/archivos/<document_id>")
@jwt_required()
def actualizar_documento(document_id):
    user = get_current_user()
    try:
        oid = ObjectId(document_id)
    except InvalidId:
        return jsonify({"error": "id inválido"}), 400

    mongo = get_mongo_db()
    doc = mongo.documents.find_one({"_id": oid, "owner_user_id": str(user.id)})
    if doc is None:
        return jsonify({"error": "Documento no encontrado"}), 404

    data = request.get_json(silent=True) or {}
    updates = {}
    if "name" in data:
        name = (data["name"] or "").strip()
        if not name:
            return jsonify({"error": "name no puede quedar vacío"}), 400
        # La extensión nunca cambia, sin importar lo que mande el cliente —
        # se le pega la del nombre original al final. El frontend ya no dejaba
        # editarla, esto es la misma regla del lado del servidor.
        original_ext = _extension_of(doc.get("name") or "")
        new_base = name[: len(name) - len(_extension_of(name))] if _extension_of(name) else name
        updates["name"] = f"{new_base}{original_ext}"
    if "folder_id" in data:
        folder_id = data["folder_id"]
        if folder_id:
            folder = DocumentFolder.query.filter_by(id=folder_id, owner_user_id=user.id).first()
            if folder is None:
                return jsonify({"error": "Carpeta no encontrada"}), 404
        updates["folder_id"] = folder_id

    if updates:
        mongo.documents.update_one({"_id": oid}, {"$set": updates})

    return jsonify({"ok": True}), 200


@documentos_bp.delete("/documentos/<document_id>")
@documentos_bp.delete("/archivos/<document_id>")
@jwt_required()
def borrar_documento(document_id):
    user = get_current_user()
    try:
        oid = ObjectId(document_id)
    except InvalidId:
        return jsonify({"error": "id inválido"}), 400

    result = get_mongo_db().documents.delete_one({"_id": oid, "owner_user_id": str(user.id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Documento no encontrado"}), 404

    return jsonify({"ok": True}), 200
