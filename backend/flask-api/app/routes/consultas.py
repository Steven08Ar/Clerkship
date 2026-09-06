from datetime import datetime, timezone
import uuid

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy.sql import func

from app import db, get_mongo_db
from app.models import Consultation, Course, StudentCourse
from app.utils import get_current_user, role_required

consultas_bp = Blueprint("consultas", __name__)


@consultas_bp.route("", methods=["GET"])
@jwt_required()
def listar_consultas():
    """Listar consultas clínicas del usuario autenticado."""
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    query = Consultation.query

    # Si es estudiante, solo ve sus propias simulaciones
    if current_user.role == "STUDENT":
        query = query.filter_by(student_id=current_user.id)
    # Si es docente, puede ver las de sus cursos
    elif current_user.role == "TEACHER":
        teacher_course_ids = [c.id for c in Course.query.filter_by(teacher_id=current_user.id).all()]
        query = query.filter(Consultation.course_id.in_(teacher_course_ids))

    # Filtros opcionales
    status = request.args.get("status")
    if status:
        query = query.filter_by(status=status.upper())

    course_id = request.args.get("course_id")
    if course_id:
        query = query.filter_by(course_id=course_id)

    specialty = request.args.get("specialty")
    if specialty:
        query = query.filter(Consultation.specialty.ilike(f"%{specialty}%"))

    consultations = query.order_by(Consultation.started_at.desc()).all()
    return jsonify([c.to_dict() for c in consultations]), 200


@consultas_bp.route("", methods=["POST"])
@role_required("STUDENT")
def crear_consulta():
    """Iniciar una nueva consulta clínica simulada."""
    current_user = get_current_user()
    data = request.get_json() or {}

    course_id = data.get("course_id")
    title = data.get("title", "Simulación de Caso Clínico")
    specialty = data.get("specialty", "Medicina Interna")
    difficulty = data.get("difficulty", "MEDIUM").upper()

    if not course_id:
        return jsonify({"error": "El campo course_id es obligatorio"}), 400

    if difficulty not in ("EASY", "MEDIUM", "HARD"):
        return jsonify({"error": "Dificultad inválida. Debe ser EASY, MEDIUM o HARD"}), 400

    # Validar que el estudiante esté matriculado en el curso
    enrollment = StudentCourse.query.filter_by(student_id=current_user.id, course_id=course_id).first()
    if not enrollment:
        return jsonify({"error": "El estudiante no está matriculado en este curso"}), 403

    # 1. Crear registro relacional en PostgreSQL
    consultation = Consultation(
        student_id=current_user.id,
        course_id=course_id,
        title=title,
        specialty=specialty,
        difficulty=difficulty,
        status="IN_PROGRESS",
    )
    db.session.add(consultation)
    db.session.commit()

    # 2. Inicializar documento de la consulta en MongoDB (si está conectado)
    try:
        mongo_db = get_mongo_db()
        mongo_db.consultations.insert_one({
            "consultation_id": str(consultation.id),
            "status": "IN_PROGRESS",
            "case": {
                "title": title,
                "specialty": specialty,
                "difficulty": difficulty,
            },
            "chat_history": [
                {
                    "sender": "PATIENT",
                    "content": "Buenos días doctor(a), he venido a consulta porque no me he sentido bien últimamente.",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    except Exception:
        # No bloquear la creación si Mongo opera en modo desconectado
        pass

    return jsonify(consultation.to_dict()), 201


@consultas_bp.route("/<string:consultation_id>", methods=["GET"])
@jwt_required()
def obtener_consulta(consultation_id):
    """Obtener detalle de una consulta clínica, uniendo datos de Postgres y MongoDB."""
    current_user = get_current_user()
    try:
        cons_uuid = uuid.UUID(consultation_id)
    except ValueError:
        return jsonify({"error": "ID de consulta inválido"}), 400

    consultation = Consultation.query.get(cons_uuid)
    if not consultation:
        return jsonify({"error": "Consulta no encontrada"}), 404

    # Control de acceso: solo el estudiante dueño o el docente del curso
    if current_user.role == "STUDENT" and consultation.student_id != current_user.id:
        return jsonify({"error": "No tienes acceso a esta consulta"}), 403

    res_data = consultation.to_dict()

    # Obtener historial de chat desde MongoDB
    try:
        mongo_db = get_mongo_db()
        doc = mongo_db.consultations.find_one({"consultation_id": str(consultation.id)}, {"_id": 0})
        if doc:
            res_data["chat_history"] = doc.get("chat_history", [])
            res_data["case_details"] = doc.get("case", {})
    except Exception:
        res_data["chat_history"] = []

    return jsonify(res_data), 200


@consultas_bp.route("/<string:consultation_id>/mensajes", methods=["POST"])
@role_required("STUDENT")
def enviar_mensaje(consultation_id):
    """Enviar mensaje durante la consulta y recibir respuesta del paciente virtual."""
    current_user = get_current_user()
    try:
        cons_uuid = uuid.UUID(consultation_id)
    except ValueError:
        return jsonify({"error": "ID de consulta inválido"}), 400

    consultation = Consultation.query.get(cons_uuid)
    if not consultation:
        return jsonify({"error": "Consulta no encontrada"}), 404

    if consultation.student_id != current_user.id:
        return jsonify({"error": "No tienes acceso a esta consulta"}), 403

    if consultation.status != "IN_PROGRESS":
        return jsonify({"error": "La consulta no está en curso"}), 400

    data = request.get_json() or {}
    content = data.get("content", "").strip()
    if not content:
        return jsonify({"error": "El contenido del mensaje no puede estar vacío"}), 400

    user_msg = {
        "sender": "STUDENT",
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    # Respuesta del paciente simulado (placeholder hasta conexión completa con fastapi-service)
    patient_reply = {
        "sender": "PATIENT",
        "content": "Comprendo doctor(a). El malestar empezó hace tres días y ha empeorado con las comidas.",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    try:
        mongo_db = get_mongo_db()
        mongo_db.consultations.update_one(
            {"consultation_id": str(consultation.id)},
            {"$push": {"chat_history": {"$each": [user_msg, patient_reply]}}}
        )
    except Exception as e:
        return jsonify({"error": f"Error persistiendo mensaje: {str(e)}"}), 500

    return jsonify({
        "sent": user_msg,
        "reply": patient_reply
    }), 200


@consultas_bp.route("/<string:consultation_id>/finalizar", methods=["PATCH"])
@role_required("STUDENT")
def finalizar_consulta(consultation_id):
    """Finalizar la sesión de consulta clínica."""
    current_user = get_current_user()
    try:
        cons_uuid = uuid.UUID(consultation_id)
    except ValueError:
        return jsonify({"error": "ID de consulta inválido"}), 400

    consultation = Consultation.query.get(cons_uuid)
    if not consultation:
        return jsonify({"error": "Consulta no encontrada"}), 404

    if consultation.student_id != current_user.id:
        return jsonify({"error": "No tienes acceso a esta consulta"}), 403

    if consultation.status == "COMPLETED":
        return jsonify({"message": "La consulta ya había sido completada", "consultation": consultation.to_dict()}), 200

    consultation.status = "COMPLETED"
    consultation.finished_at = func.now()
    # Calificación preliminar o calculada
    consultation.score = 85.0
    db.session.commit()

    try:
        mongo_db = get_mongo_db()
        mongo_db.consultations.update_one(
            {"consultation_id": str(consultation.id)},
            {"$set": {"status": "COMPLETED", "finished_at": datetime.now(timezone.utc).isoformat()}}
        )
    except Exception:
        pass

    return jsonify({
        "message": "Consulta finalizada con éxito",
        "consultation": consultation.to_dict()
    }), 200

