import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base

if TYPE_CHECKING:
    from .user import User


class OriginalityEnum(str, enum.Enum):
    ORIGINAL = "original"
    REPLICA = "replica"
    UNKNOWN = "unknown"


class Coin(Base):
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(100), index=True)
    quantity: Mapped[int] = mapped_column(Integer)
    year: Mapped[int] = mapped_column(index=True)
    country: Mapped[str] = mapped_column(String(100), index=True)
    face_value: Mapped[str] = mapped_column(String(100))
    purchase_price: Mapped[float | None] = mapped_column(Float)
    estimated_value: Mapped[float | None] = mapped_column(Float)
    originality: Mapped[OriginalityEnum] = mapped_column(
        Enum(OriginalityEnum),
        default=OriginalityEnum.ORIGINAL,
        index=True,
    )
    condition: Mapped[str | None] = mapped_column(String(100), index=True)
    storage_location: Mapped[str | None] = mapped_column(String(200))
    category: Mapped[str | None] = mapped_column(String(100), index=True)
    acquisition_date: Mapped[datetime | None] = mapped_column(DateTime)
    acquisition_source: Mapped[str | None] = mapped_column(String(200))
    notes: Mapped[str | None] = mapped_column(Text)
    image_url_front: Mapped[str | None] = mapped_column(String(500))
    image_url_back: Mapped[str | None] = mapped_column(String(500))

    # Foreign Key
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationship
    owner: Mapped["User"] = relationship(back_populates="coins")
