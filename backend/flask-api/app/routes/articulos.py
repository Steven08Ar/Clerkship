from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app import db
from app.models import Article, ArticleTag, StudentLibrary
from app.models.article import ARTICLE_TYPES
from app.models.student_library import SHELF_STATUSES
from app.utils import get_current_user, role_required

articulos_bp = Blueprint("articulos", __name__)


def _tags_for(article_id):
    return [t.tag for t in ArticleTag.query.filter_by(article_id=article_id).all()]


@articulos_bp.get("")
@jwt_required()
def listar():
    query = Article.query

    type_filter = request.args.get("type")
    if type_filter:
        query = query.filter(Article.type == type_filter.upper())

    specialty = request.args.get("specialty")
    if specialty:
        query = query.filter(Article.specialty.ilike(f"%{specialty}%"))

    search = request.args.get("q")
    if search:
        query = query.filter(Article.title.ilike(f"%{search}%"))

    tag = request.args.get("tag")
    if tag:
        query = query.join(ArticleTag, ArticleTag.article_id == Article.id).filter(ArticleTag.tag == tag)

    articles = query.order_by(Article.created_at.desc()).all()
    return jsonify({"articles": [a.to_dict(tags=_tags_for(a.id)) for a in articles]}), 200


@articulos_bp.post("")
@role_required("TEACHER")
def crear():
    user = get_current_user()
    data = request.get_json(silent=True) or {}

    article_type = (data.get("type") or "").strip().upper()
    if article_type not in ARTICLE_TYPES:
        return jsonify({"error": f"type debe ser uno de: {', '.join(ARTICLE_TYPES)}"}), 400
    if not data.get("title") or not data.get("url"):
        return jsonify({"error": "title y url son requeridos"}), 400

    article = Article(
        type=article_type,
        title=data["title"].strip(),
        authors=data.get("authors"),
        category=data.get("category"),
        specialty=data.get("specialty"),
        source=data.get("source"),
        year=data.get("year"),
        pages=data.get("pages"),
        description=data.get("description"),
        url=data["url"].strip(),
        created_by=user.id,
    )
    db.session.add(article)
    db.session.flush()

    for tag in data.get("tags", []):
        db.session.add(ArticleTag(article_id=article.id, tag=tag.strip().lower()))

    db.session.commit()
    return jsonify({"article": article.to_dict(tags=_tags_for(article.id))}), 201


@articulos_bp.get("/<article_id>")
@jwt_required()
def obtener(article_id):
    article = Article.query.get(article_id)
    if article is None:
        return jsonify({"error": "Artículo no encontrado"}), 404
    return jsonify({"article": article.to_dict(tags=_tags_for(article.id))}), 200


@articulos_bp.get("/estante")
@role_required("STUDENT")
def obtener_estante():
    user = get_current_user()
    entries = StudentLibrary.query.filter_by(student_id=user.id).all()
    return jsonify({"estante": [e.to_dict() for e in entries]}), 200


@articulos_bp.post("/<article_id>/estante")
@role_required("STUDENT")
def guardar_en_estante(article_id):
    user = get_current_user()
    data = request.get_json(silent=True) or {}
    status = (data.get("status") or "NEXT").strip().upper()

    if status not in SHELF_STATUSES:
        return jsonify({"error": f"status debe ser uno de: {', '.join(SHELF_STATUSES)}"}), 400
    if Article.query.get(article_id) is None:
        return jsonify({"error": "Artículo no encontrado"}), 404

    entry = StudentLibrary.query.filter_by(student_id=user.id, article_id=article_id).first()
    if entry is None:
        entry = StudentLibrary(student_id=user.id, article_id=article_id, status=status)
        db.session.add(entry)
    else:
        entry.status = status

    db.session.commit()
    return jsonify({"estante": entry.to_dict()}), 200


@articulos_bp.delete("/<article_id>/estante")
@role_required("STUDENT")
def quitar_de_estante(article_id):
    user = get_current_user()
    entry = StudentLibrary.query.filter_by(student_id=user.id, article_id=article_id).first()
    if entry is None:
        return jsonify({"error": "Ese artículo no está en tu estante"}), 404

    db.session.delete(entry)
    db.session.commit()
    return jsonify({"message": "Quitado del estante"}), 200
