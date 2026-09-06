from sqlalchemy.dialects.postgresql import UUID

from app import db


class ArticleTag(db.Model):
    __tablename__ = "article_tags"

    article_id = db.Column(UUID(as_uuid=True), db.ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True)
    tag = db.Column(db.String(50), primary_key=True)
