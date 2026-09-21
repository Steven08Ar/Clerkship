from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app import db


class Course(db.Model):
    __tablename__ = "courses"

    id = db.Column(UUID(as_uuid=True), primary_key=True, server_default=db.text("uuid_generate_v4()"))
    teacher_id = db.Column(UUID(as_uuid=True), db.ForeignKey("teachers.user_id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)
    academic_period = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, server_default=func.now())
    updated_at = db.Column(db.DateTime, server_default=func.now())

    def to_dict(self):
        return {
            "id": str(self.id),
            "teacher_id": str(self.teacher_id),
            "name": self.name,
            "description": self.description,
            "academic_period": self.academic_period,
        }
