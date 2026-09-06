from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app import db


class CommunityLike(db.Model):
    __tablename__ = "community_likes"

    post_id = db.Column(UUID(as_uuid=True), db.ForeignKey("community_posts.id", ondelete="CASCADE"), primary_key=True)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    created_at = db.Column(db.DateTime, server_default=func.now())
