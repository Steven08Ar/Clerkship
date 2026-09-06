from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app import db

SHELF_STATUSES = ("NEXT", "FINISHED")


class StudentLibrary(db.Model):
    __tablename__ = "student_library"

    student_id = db.Column(UUID(as_uuid=True), db.ForeignKey("students.user_id", ondelete="CASCADE"), primary_key=True)
    article_id = db.Column(UUID(as_uuid=True), db.ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True)
    status = db.Column(db.Enum(*SHELF_STATUSES, name="shelf_status", create_type=False), nullable=False, default="NEXT")
    added_at = db.Column(db.DateTime, server_default=func.now())

    def to_dict(self):
        return {
            "article_id": str(self.article_id),
            "status": self.status,
        }
