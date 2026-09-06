from sqlalchemy.dialects.postgresql import UUID

from app import db


class Teacher(db.Model):
    __tablename__ = "teachers"

    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    department = db.Column(db.String(150))
