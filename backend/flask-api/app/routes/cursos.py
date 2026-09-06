from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app import db
from app.models import Course, StudentCourse
from app.utils import get_current_user, role_required

cursos_bp = Blueprint("cursos", __name__)


@cursos_bp.get("")
@jwt_required()
def listar():
    courses = Course.query.order_by(Course.created_at.desc()).all()
    return jsonify({"courses": [c.to_dict() for c in courses]}), 200


@cursos_bp.get("/mios")
@jwt_required()
def listar_mios():
    user = get_current_user()

    if user.role == "TEACHER":
        courses = Course.query.filter_by(teacher_id=user.id).all()
    else:
        courses = (
            Course.query.join(StudentCourse, StudentCourse.course_id == Course.id)
            .filter(StudentCourse.student_id == user.id)
            .all()
        )

    return jsonify({"courses": [c.to_dict() for c in courses]}), 200


@cursos_bp.post("")
@role_required("TEACHER")
def crear():
    user = get_current_user()
    data = request.get_json(silent=True) or {}

    if not data.get("name"):
        return jsonify({"error": "name es requerido"}), 400

    course = Course(
        teacher_id=user.id,
        name=data["name"].strip(),
        description=data.get("description"),
        academic_period=data.get("academic_period"),
    )
    db.session.add(course)
    db.session.commit()

    return jsonify({"course": course.to_dict()}), 201


@cursos_bp.get("/<course_id>")
@jwt_required()
def obtener(course_id):
    course = Course.query.get(course_id)
    if course is None:
        return jsonify({"error": "Curso no encontrado"}), 404
    return jsonify({"course": course.to_dict()}), 200


@cursos_bp.post("/<course_id>/matricular")
@role_required("STUDENT")
def matricular(course_id):
    user = get_current_user()

    if Course.query.get(course_id) is None:
        return jsonify({"error": "Curso no encontrado"}), 404

    if StudentCourse.query.filter_by(student_id=user.id, course_id=course_id).first() is not None:
        return jsonify({"error": "Ya estás matriculado en este curso"}), 409

    db.session.add(StudentCourse(student_id=user.id, course_id=course_id))
    db.session.commit()

    return jsonify({"message": "Matrícula registrada"}), 201


@cursos_bp.delete("/<course_id>/matricular")
@role_required("STUDENT")
def desmatricular(course_id):
    user = get_current_user()

    enrollment = StudentCourse.query.filter_by(student_id=user.id, course_id=course_id).first()
    if enrollment is None:
        return jsonify({"error": "No estás matriculado en este curso"}), 404

    db.session.delete(enrollment)
    db.session.commit()

    return jsonify({"message": "Matrícula eliminada"}), 200
