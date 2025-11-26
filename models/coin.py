from datetime import date, datetime
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, ForeignKey, Date, Text, Numeric, Integer, func
from sqlalchemy.dialects.postgresql import BIGINT
from .base import Base

class Coin(Base):
  __tablename__ = "coins"
  id: Mapped[int] = mapped_column(BIGINT, primary_key=True)
  user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
  year: Mapped[int] = mapped_column(Integer, index=True)
  country: Mapped[str] = mapped_column(String(120), index=True)
  face_value: Mapped[str] = mapped_column(String(60))
  purchase_price: Mapped["Decimal" | None] = mapped_column(Numeric(12,2))
  estimated_value: Mapped["Decimal" | None] = mapped_column(Numeric(12,2))
  originality: Mapped[str] = mapped_column(String(16), index=True)
  condition: Mapped[str] = mapped_column(String(20), index=True)
  condition_notes: Mapped[str | None] = mapped_column(Text)
  storage_location: Mapped[str | None] = mapped_column(String(120))
  category: Mapped[str | None] = mapped_column(String(60), index=True)
  acquisition_date: Mapped["date" | None] = mapped_column(Date)
  acquisition_source: Mapped[str | None] = mapped_column(String(120))
  notes: Mapped[str | None] = mapped_column(Text)
  image_url_front: Mapped[str | None] = mapped_column(Text)
  image_url_back: Mapped[str | None] = mapped_column(Text)
  currency: Mapped[str] = mapped_column(String(3), default="BRL")
  created_at: Mapped["datetime"] = mapped_column(server_default=func.now())
  updated_at: Mapped["datetime"] = mapped_column(server_default=func.now(), onupdate=func.now())
