"""
Academic community forum Request and Response schemas for Clerkship API.
"""

from typing import Optional
from pydantic import Field
from app.schemas.base import BaseSchema


class CreatePostRequest(BaseSchema):
    """Payload to create a discussion post in the community."""

    title: str = Field(..., min_length=1, max_length=200, description="Título de la publicación")
    content: str = Field(..., min_length=1, description="Cuerpo del mensaje o discusión clínica")


class CommunityPostResponse(BaseSchema):
    """Community post representation."""

    id: str
    user_id: str
    author_name: Optional[str] = None
    title: str
    content: str
    likes_count: int = 0
    comments_count: int = 0
    created_at: Optional[str] = None


class CreateCommentRequest(BaseSchema):
    """Payload to add a comment to a discussion post."""

    content: str = Field(..., min_length=1, description="Texto del comentario")


class CommunityCommentResponse(BaseSchema):
    """Community comment representation."""

    id: str
    post_id: str
    user_id: str
    author_name: Optional[str] = None
    content: str
    created_at: Optional[str] = None


class LikeResponse(BaseSchema):
    """Response returned when toggling like on a post."""

    liked: bool
    likes_count: int

