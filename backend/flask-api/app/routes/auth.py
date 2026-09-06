import random
import re
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)
from werkzeug.security import check_password_hash, generate_password_hash

from app import db
from app.mailer import send_verification_email
from app.models import Student, Teacher, User

auth_bp = Blueprint("auth", __name__)

VERIFICATION_CODE_TTL_MINUTES = 10
MAX_VERIFICATION_ATTEMPTS = 5
RESEND_COOLDOWN_SECONDS = 30


def _build_username(email: str) -> str:
    base = re.sub(r"[^a-z0-9]", "", email.split("@")[0].lower()) or "usuario"
    username = base
    suffix = 1
    while User.query.filter_by(username=username).first() is not None:
        suffix += 1
        username = f"{base}{suffix}"
    return username


def _issue_tokens(user: User):
    identity = str(user.id)
    return {
        "access_token": create_access_token(identity=identity, additional_claims={"role": user.role}),
        "refresh_token": create_refresh_token(identity=identity),
    }


def _generate_and_send_code(user: User):
    code = f"{random.randint(0, 999999):06d}"
    user.verification_code = code
    user.verification_code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_CODE_TTL_MINUTES)
    user.verification_attempts = 0
    db.session.commit()
    send_verification_email(user.email, user.first_name, code)


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}

    required = ["first_name", "last_name", "email", "password", "role"]
    missing = [field for field in required if not data.get(field)]
    if missing:
        return jsonify({"error": f"Campos requeridos faltantes: {', '.join(missing)}"}), 400

    email = data["email"].strip().lower()
    role = data["role"].strip().upper()
    password = data["password"]

    if role not in ("STUDENT", "TEACHER"):
        return jsonify({"error": "role debe ser STUDENT o TEACHER"}), 400

    if len(password) < 8:
        return jsonify({"error": "La contraseña debe tener al menos 8 caracteres"}), 400

    if User.query.filter_by(email=email).first() is not None:
        return jsonify({"error": "Ya existe una cuenta con ese correo"}), 409

    if role == "STUDENT":
        student_code = (data.get("student_code") or "").strip()
        if not student_code:
            return jsonify({"error": "student_code es requerido para el rol STUDENT"}), 400
        if not student_code.upper().startswith("U00"):
            return jsonify({"error": 'El código de estudiante debe empezar con "U00"'}), 400

    user = User(
        username=_build_username(email),
        first_name=data["first_name"].strip(),
        last_name=data["last_name"].strip(),
        email=email,
        password_hash=generate_password_hash(password),
        role=role,
    )
    db.session.add(user)
    db.session.flush()  # asigna user.id (uuid_generate_v4) antes del commit

    if role == "STUDENT":
        db.session.add(Student(
            user_id=user.id,
            student_code=student_code,
            semester=data.get("semester"),
        ))
    else:
        db.session.add(Teacher(
            user_id=user.id,
            department=data.get("department"),
        ))

    db.session.commit()

    # El registro no queda "listo" todavía: falta verificar el correo y (en
    # el frontend) elegir avatar. Se emiten tokens igual porque el resto del
    # flujo (verify-email, guardar avatar) también necesita sesión — pero el
    # login de una cuenta ya existente sin verificar queda bloqueado (ver
    # login() más abajo), así nadie se salta la verificación por error.
    _generate_and_send_code(user)

    return jsonify({"user": user.to_dict(), **_issue_tokens(user)}), 201


@auth_bp.post("/verify-email")
@jwt_required()
def verify_email():
    user = User.query.get(get_jwt_identity())
    if user is None:
        return jsonify({"error": "Usuario no encontrado"}), 404
    if user.email_verified:
        return jsonify({"user": user.to_dict()}), 200

    data = request.get_json(silent=True) or {}
    code = (data.get("code") or "").strip()

    if user.verification_attempts >= MAX_VERIFICATION_ATTEMPTS:
        return jsonify({"error": "Demasiados intentos. Pedí un código nuevo."}), 429

    if (
        not user.verification_code
        or not user.verification_code_expires_at
        or datetime.now(timezone.utc) > user.verification_code_expires_at.replace(tzinfo=timezone.utc)
    ):
        return jsonify({"error": "El código venció. Pedí uno nuevo."}), 400

    if code != user.verification_code:
        user.verification_attempts += 1
        db.session.commit()
        restantes = MAX_VERIFICATION_ATTEMPTS - user.verification_attempts
        return jsonify({"error": f"Código incorrecto. Te quedan {max(restantes, 0)} intentos."}), 400

    user.email_verified = True
    user.verification_code = None
    user.verification_code_expires_at = None
    user.verification_attempts = 0
    db.session.commit()

    return jsonify({"user": user.to_dict()}), 200


@auth_bp.post("/resend-code")
@jwt_required()
def resend_code():
    user = User.query.get(get_jwt_identity())
    if user is None:
        return jsonify({"error": "Usuario no encontrado"}), 404
    if user.email_verified:
        return jsonify({"error": "Este correo ya está verificado"}), 400

    # Throttle simple: si el código actual todavía tiene casi todo su tiempo
    # de vida restante, es que se pidió hace menos de RESEND_COOLDOWN_SECONDS.
    if user.verification_code_expires_at:
        expires_at = user.verification_code_expires_at.replace(tzinfo=timezone.utc)
        seconds_left = (expires_at - datetime.now(timezone.utc)).total_seconds()
        elapsed = VERIFICATION_CODE_TTL_MINUTES * 60 - seconds_left
        if elapsed < RESEND_COOLDOWN_SECONDS:
            return jsonify({"error": f"Esperá {int(RESEND_COOLDOWN_SECONDS - elapsed)}s antes de reenviar"}), 429

    _generate_and_send_code(user)
    return jsonify({"ok": True}), 200


@auth_bp.post("/avatar")
@jwt_required()
def guardar_avatar():
    user = User.query.get(get_jwt_identity())
    if user is None:
        return jsonify({"error": "Usuario no encontrado"}), 404

    data = request.get_json(silent=True) or {}
    svg = (data.get("avatar_svg") or "").strip()
    if not svg.startswith("<svg"):
        return jsonify({"error": "avatar_svg debe ser un SVG válido"}), 400
    if len(svg) > 100_000:
        return jsonify({"error": "El avatar es demasiado pesado"}), 413

    user.avatar_svg = svg
    db.session.commit()
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "email y password son requeridos"}), 400

    user = User.query.filter_by(email=email).first()
    if user is None or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Credenciales inválidas"}), 401

    if not user.email_verified:
        # Le mandamos un código nuevo (por si el anterior venció hace rato) y
        # tokens igual, para que el frontend pueda mandarlo directo a la
        # pantalla de verificación en vez de rebotarlo sin explicación.
        _generate_and_send_code(user)
        return jsonify({
            "error": "email_not_verified",
            "user": user.to_dict(),
            **_issue_tokens(user),
        }), 403

    return jsonify({"user": user.to_dict(), **_issue_tokens(user)}), 200


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    # NOTA (corregido): antes se leía el rol de get_jwt().get("role"), pero
    # el refresh_token nunca llevó ese claim (solo el access_token lo tiene,
    # ver _issue_tokens) — siempre daba None y el access_token renovado
    # quedaba con role=null, rompiendo silenciosamente @role_required en
    # cualquier ruta después de un refresh. Se busca el rol real en la BD.
    user = User.query.get(identity)
    if user is None:
        return jsonify({"error": "Usuario no encontrado"}), 404

    return jsonify({
        "access_token": create_access_token(identity=identity, additional_claims={"role": user.role}),
    }), 200


@auth_bp.get("/me")
@jwt_required()
def me():
    user = User.query.get(get_jwt_identity())
    if user is None:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.post("/change-password")
@jwt_required()
def change_password():
    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""

    if len(new_password) < 8:
        return jsonify({"error": "La nueva contraseña debe tener al menos 8 caracteres"}), 400

    user = User.query.get(get_jwt_identity())
    if user is None or not check_password_hash(user.password_hash, current_password):
        return jsonify({"error": "Contraseña actual incorrecta"}), 401

    user.password_hash = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({"message": "Contraseña actualizada"}), 200
