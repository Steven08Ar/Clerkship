import logging
import requests
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required

from app.config import Config
from app.schemas import EmailNotificationResponse, EmailStatusResponse, SendNotificationRequest, validate_body
from app.utils import get_current_user

logger = logging.getLogger(__name__)
email_bp = Blueprint("email", __name__)


@email_bp.route("/status", methods=["GET"])
def email_status():
    """Estado de configuración del servicio de correo electrónico."""
    is_configured = bool(Config.MAILGUN_API_KEY and Config.MAILGUN_DOMAIN)
    return jsonify({
        "service": "Mailgun",
        "configured": is_configured,
        "mode": "live" if is_configured else "simulated",
        "domain": Config.MAILGUN_DOMAIN if is_configured else "none",
        "from_address": Config.MAILGUN_FROM,
    }), 200


@email_bp.route("/notificar", methods=["POST"])
@jwt_required()
@validate_body(SendNotificationRequest)
def enviar_notificacion(validated_body: SendNotificationRequest):
    """Enviar notificación por correo a un destinatario."""
    current_user = get_current_user()

    to_email = validated_body.to
    subject = validated_body.subject.strip()
    text_content = validated_body.text.strip()

    api_key = current_app.config.get("MAILGUN_API_KEY")
    domain = current_app.config.get("MAILGUN_DOMAIN")

    if not api_key or not domain:
        logger.warning(
            "[MODO SIMULADO] Correo para %s - Asunto: %s - Contenido: %s",
            to_email, subject, text_content
        )
        return jsonify({
            "success": True,
            "mode": "simulated",
            "recipient": to_email,
            "message": "Correo simulado (impreso en consola del servidor)"
        }), 200

    try:
        response = requests.post(
            f"https://api.mailgun.net/v3/{domain}/messages",
            auth=("api", api_key),
            data={
                "from": current_app.config.get("MAILGUN_FROM"),
                "to": [to_email],
                "subject": subject,
                "text": text_content,
                "html": f"<p>{text_content}</p><br><small>Enviado por {current_user.email} vía Clerkship</small>",
            },
            timeout=10,
        )
        response.raise_for_status()
        return jsonify({
            "success": True,
            "recipient": to_email,
            "message": "Correo enviado con éxito"
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error al enviar correo: {str(e)}"
        }), 500
