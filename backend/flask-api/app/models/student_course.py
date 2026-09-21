from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app import db


class StudentCourse(db.Model):
    __tablename__ = "student_courses"

    student_id = db.Column(UUID(as_uuid=True), db.ForeignKey("students.user_id", ondelete="CASCADE"), primary_key=True)
    course_id = db.Column(UUID(as_uuid=True), db.ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
    enrolled_at = db.Column(db.DateTime, server_default=func.now())
