from sqlalchemy import Column, ForeignKey, Integer, String, Float, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from models.base import Base

class OriginalityEnum(str, enum.Enum):
    original = "original"
    replica = "replica"
    unknown = "unknown"


class Coin(Base):
    __tablename__ = "coins"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False, index=True)
    country = Column(String(100), nullable=False, index=True)
    face_value = Column(String(100), nullable=False)
    purchase_price = Column(Float, nullable=True)
    estimated_value = Column(Float, nullable=True)
    originality = Column(
        Enum(OriginalityEnum),
        nullable=False,
        default=OriginalityEnum.original,
        index=True,
    )
    condition = Column(String(100), nullable=True, index=True)
    storage_location = Column(String(200), nullable=True)
    category = Column(String(100), nullable=True, index=True)
    acquisition_date = Column(DateTime, nullable=True)
    acquisition_source = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    image_url_front = Column(String(500), nullable=True)
    image_url_back = Column(String(500), nullable=True)
    
    owner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    
    owner = relationship("User", back_populates="coins")
