from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Column, DateTime, String, func
from sqlalchemy.dialects.postgresql import BIGINT
from .base import Base

class User(Base):
  __tablename__ = "users"
  id: Mapped[int] = mapped_column(BIGINT, primary_key=True)
  email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
  hashed_password: Mapped[str] = mapped_column(String)
  display_name: Mapped[str | None] = mapped_column(String(100))
  coins = relationship(
    "Coin",
    back_populates="owner",
    cascade="all, delete-orphan",
  )
  
  created_at = Column(
    DateTime(timezone=True),
    server_default=func.now(),
    nullable=False,
  )
  updated_at = Column(
    DateTime(timezone=True),
    server_default=func.now(),
    onupdate=func.now(),
    nullable=False,
  )
