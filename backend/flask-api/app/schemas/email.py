"""
Email service Request and Response schemas for Clerkship API.
"""

from pydantic import EmailStr, Field
from app.schemas.base import BaseSchema


class SendNotificationRequest(BaseSchema):
    """Payload to dispatch an assisted email notification."""

    to: EmailStr = Field(..., description="Correo del destinatario")
    subject: str = Field(..., min_length=1, max_length=200, description="Asunto del correo")
    text: str = Field(..., min_length=1, description="Cuerpo del mensaje")


class EmailStatusResponse(BaseSchema):
    """Mailgun service health and configuration diagnostic."""

    service: str = "Mailgun"
    configured: bool
    mode: str
    domain: str
    from_address: str


class EmailNotificationResponse(BaseSchema):
    """Response returned upon email dispatch attempt."""

    success: bool
    recipient: str
    message: str

