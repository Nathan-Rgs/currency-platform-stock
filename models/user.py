from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, func
from sqlalchemy.dialects.postgresql import BIGINT
from .base import Base

class User(Base):
  __tablename__ = "users"
  id: Mapped[int] = mapped_column(BIGINT, primary_key=True)
  email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
  password_hash: Mapped[str] = mapped_column(String)
  display_name: Mapped[str | None] = mapped_column(String(100))
  created_at: Mapped["datetime"] = mapped_column(server_default=func.now())
