"""
Folder and document management Request and Response schemas for Clerkship API.
"""

from typing import Optional
from pydantic import Field
from app.schemas.base import BaseSchema


class CreateFolderRequest(BaseSchema):
    """Payload to create a document organization folder."""

    name: str = Field(..., min_length=1, max_length=100, description="Nombre de la carpeta")
    color: Optional[str] = Field("#10B981", pattern=r"^#[0-9A-Fa-f]{6}$", description="Color hexadecimal (ej. #10B981)")


class UpdateFolderRequest(BaseSchema):
    """Payload to update folder properties."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")


class DocumentFolderResponse(BaseSchema):
    """Folder metadata representation."""

    id: str
    name: str
    color: Optional[str] = "#10B981"
    files_count: int = 0


class UploadDocumentRequest(BaseSchema):
    """Payload to upload a clinical file or document."""

    folder_id: Optional[str] = Field(None, description="ID de la carpeta contenedora si aplica")
    name: str = Field(..., min_length=1, max_length=255, description="Nombre del archivo con extensión")
    mime_type: Optional[str] = Field("application/pdf", description="Tipo MIME del documento")
    file_base64: str = Field(..., min_length=1, description="Contenido en Base64")


class DocumentFileResponse(BaseSchema):
    """Uploaded document metadata representation."""

    id: str
    name: str
    folder_id: Optional[str] = None
    size_bytes: Optional[int] = 0
    mime_type: Optional[str] = None
    created_at: Optional[str] = None

