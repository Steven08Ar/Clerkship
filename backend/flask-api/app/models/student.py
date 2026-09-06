from sqlalchemy.dialects.postgresql import UUID

from app import db


class Student(db.Model):
    __tablename__ = "students"

    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    student_code = db.Column(db.String(50), unique=True, nullable=False)
    semester = db.Column(db.SmallInteger, nullable=True)
