"""
Medical library article Request and Response schemas for Clerkship API.
"""

from typing import List, Literal, Optional
from pydantic import Field
from app.schemas.base import BaseSchema


class CreateArticleRequest(BaseSchema):
    """Payload to create a new medical article in the library."""

    title: str = Field(..., min_length=1, max_length=200, description="Título del artículo")
    content: str = Field(..., min_length=1, description="Contenido completo en Markdown o texto")
    specialty: str = Field(..., min_length=1, max_length=100, description="Especialidad clínica")
    summary: Optional[str] = Field(None, max_length=500, description="Resumen o abstract")
    tags: List[str] = Field(default_factory=list, description="Etiquetas temáticas asociadas")


class ArticleResponse(BaseSchema):
    """Medical article representation."""

    id: str
    teacher_id: Optional[str] = None
    title: str
    content: str
    summary: Optional[str] = None
    specialty: str
    tags: List[str] = Field(default_factory=list)
    created_at: Optional[str] = None


class UpdateShelfRequest(BaseSchema):
    """Payload to add or update an article in the student's personal reading shelf."""

    status: Literal["NEXT", "FINISHED"] = "NEXT"


class StudentShelfItem(BaseSchema):
    """Student reading shelf item representation."""

    id: str
    article_id: str
    status: Literal["NEXT", "FINISHED"]
    article: Optional[ArticleResponse] = None

