"""
Envío del correo de verificación por Mailgun.

Modo simulado: si MAILGUN_API_KEY o MAILGUN_DOMAIN no están seteados (todavía
no se verificó clerk-ship.online en Mailgun), el código NO se manda por
correo de verdad — se imprime en la consola del backend, para poder probar
el flujo completo (registro → verificación → avatar) sin depender del
dominio ya verificado. El día que Mailgun esté listo, solo hace falta poner
las variables de entorno; el código de acá no cambia.
"""
import logging

import requests
from flask import current_app

from app.email_templates import verification_email_html

logger = logging.getLogger(__name__)


def send_verification_email(to_email: str, first_name: str, code: str) -> None:
    api_key = current_app.config.get("MAILGUN_API_KEY")
    domain = current_app.config.get("MAILGUN_DOMAIN")

    if not api_key or not domain:
        logger.warning(
            "[MODO SIMULADO] Mailgun no está configurado — código de verificación "
            "para %s: %s (válido 10 minutos)",
            to_email, code,
        )
        return

    response = requests.post(
        f"https://api.mailgun.net/v3/{domain}/messages",
        auth=("api", api_key),
        data={
            "from": current_app.config.get("MAILGUN_FROM"),
            "to": [to_email],
            "subject": "Tu código de verificación de Clerkship",
            "text": (
                f"Hola {first_name},\n\n"
                f"Tu código de verificación es: {code}\n\n"
                "Vence en 10 minutos. Si no creaste una cuenta en Clerkship, "
                "ignorá este correo."
            ),
            "html": verification_email_html(first_name, code),
        },
        timeout=10,
    )
    response.raise_for_status()
