from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app import db
from app.models import CommunityComment, CommunityLike, CommunityPost
from app.utils import get_current_user

comunidad_bp = Blueprint("comunidad", __name__)


def _post_dict(post):
    like_count = CommunityLike.query.filter_by(post_id=post.id).count()
    comment_count = CommunityComment.query.filter_by(post_id=post.id).count()
    return post.to_dict(like_count=like_count, comment_count=comment_count)


@comunidad_bp.get("/posts")
@jwt_required()
def listar_posts():
    posts = CommunityPost.query.order_by(CommunityPost.created_at.desc()).all()
    return jsonify({"posts": [_post_dict(p) for p in posts]}), 200


@comunidad_bp.post("/posts")
@jwt_required()
def crear_post():
    user = get_current_user()
    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()

    if not content:
        return jsonify({"error": "content es requerido"}), 400

    post = CommunityPost(author_id=user.id, content=content)
    db.session.add(post)
    db.session.commit()

    return jsonify({"post": _post_dict(post)}), 201


@comunidad_bp.delete("/posts/<post_id>")
@jwt_required()
def eliminar_post(post_id):
    user = get_current_user()
    post = CommunityPost.query.get(post_id)

    if post is None:
        return jsonify({"error": "Publicación no encontrada"}), 404
    if str(post.author_id) != str(user.id):
        return jsonify({"error": "Solo puedes eliminar tus propias publicaciones"}), 403

    db.session.delete(post)
    db.session.commit()
    return jsonify({"message": "Publicación eliminada"}), 200


@comunidad_bp.get("/posts/<post_id>/comentarios")
@jwt_required()
def listar_comentarios(post_id):
    comments = CommunityComment.query.filter_by(post_id=post_id).order_by(CommunityComment.created_at.asc()).all()
    return jsonify({"comentarios": [c.to_dict() for c in comments]}), 200


@comunidad_bp.post("/posts/<post_id>/comentarios")
@jwt_required()
def crear_comentario(post_id):
    user = get_current_user()
    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()

    if not content:
        return jsonify({"error": "content es requerido"}), 400
    if CommunityPost.query.get(post_id) is None:
        return jsonify({"error": "Publicación no encontrada"}), 404

    comment = CommunityComment(post_id=post_id, author_id=user.id, content=content)
    db.session.add(comment)
    db.session.commit()

    return jsonify({"comentario": comment.to_dict()}), 201


@comunidad_bp.post("/posts/<post_id>/like")
@jwt_required()
def alternar_like(post_id):
    user = get_current_user()

    if CommunityPost.query.get(post_id) is None:
        return jsonify({"error": "Publicación no encontrada"}), 404

    like = CommunityLike.query.filter_by(post_id=post_id, user_id=user.id).first()
    if like is None:
        db.session.add(CommunityLike(post_id=post_id, user_id=user.id))
        db.session.commit()
        return jsonify({"liked": True}), 201

    db.session.delete(like)
    db.session.commit()
    return jsonify({"liked": False}), 200
