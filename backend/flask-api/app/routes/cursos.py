from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app import db
from app.models import Course, StudentCourse
from app.schemas import CourseResponse, CreateCourseRequest, EnrollmentResponse, validate_body
from app.utils import get_current_user, role_required

cursos_bp = Blueprint("cursos", __name__)


@cursos_bp.get("")
@jwt_required()
def listar():
    courses = Course.query.order_by(Course.created_at.desc()).all()
    return jsonify([c.to_dict() for c in courses]), 200


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

    return jsonify([c.to_dict() for c in courses]), 200


@cursos_bp.post("")
@role_required("TEACHER")
@validate_body(CreateCourseRequest)
def crear(validated_body: CreateCourseRequest):
    user = get_current_user()

    course = Course(
        teacher_id=user.id,
        name=validated_body.name.strip(),
        description=validated_body.description,
        academic_period=validated_body.academic_period,
    )
    db.session.add(course)
    db.session.commit()

    return jsonify(course.to_dict()), 201


@cursos_bp.get("/<course_id>")
@jwt_required()
def obtener(course_id):
    course = Course.query.get(course_id)
    if course is None:
        return jsonify({
            "error": "Not Found",
            "message": "Curso no encontrado",
            "status_code": 404
        }), 404
    return jsonify(course.to_dict()), 200


@cursos_bp.post("/<course_id>/matricular")
@role_required("STUDENT")
def matricular(course_id):
    user = get_current_user()

    if Course.query.get(course_id) is None:
        return jsonify({
            "error": "Not Found",
            "message": "Curso no encontrado",
            "status_code": 404
        }), 404

    if StudentCourse.query.filter_by(student_id=user.id, course_id=course_id).first() is not None:
        return jsonify({
            "error": "Conflict",
            "message": "Ya estás matriculado en este curso",
            "status_code": 409
        }), 409

    db.session.add(StudentCourse(student_id=user.id, course_id=course_id))
    db.session.commit()

    return jsonify({
        "message": "Matrícula registrada exitosamente",
        "course_id": str(course_id),
        "student_id": str(user.id),
    }), 201


@cursos_bp.delete("/<course_id>/matricular")
@role_required("STUDENT")
def desmatricular(course_id):
    user = get_current_user()

    enrollment = StudentCourse.query.filter_by(student_id=user.id, course_id=course_id).first()
    if enrollment is None:
        return jsonify({
            "error": "Not Found",
            "message": "No estás matriculado en este curso",
            "status_code": 404
        }), 404

    db.session.delete(enrollment)
    db.session.commit()

    return jsonify({"message": "Matrícula eliminada exitosamente"}), 200

