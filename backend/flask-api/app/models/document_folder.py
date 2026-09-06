from datetime import timezone

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app import db


class DocumentFolder(db.Model):
    __tablename__ = "document_folders"

    id = db.Column(UUID(as_uuid=True), primary_key=True, server_default=db.text("uuid_generate_v4()"))
    owner_user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    parent_folder_id = db.Column(UUID(as_uuid=True), db.ForeignKey("document_folders.id", ondelete="CASCADE"), nullable=True)
    name = db.Column(db.String(150), nullable=False)
    color = db.Column(db.String(7), nullable=False, server_default="#0284C7")
    created_at = db.Column(db.DateTime, server_default=func.now())
    updated_at = db.Column(db.DateTime, server_default=func.now())

    def to_dict(self):
        # Columna naive pero siempre en UTC — sin marcar tzinfo, isoformat()
        # no lleva "+00:00" y el navegador la interpretaría como hora local
        # (mismo bug ya corregido antes en chats.py / conversation.py).
        created = self.created_at.replace(tzinfo=timezone.utc).isoformat() if self.created_at else None
        return {
            "id": str(self.id),
            "parent_folder_id": str(self.parent_folder_id) if self.parent_folder_id else None,
            "name": self.name,
            "color": self.color,
            "created_at": created,
        }
