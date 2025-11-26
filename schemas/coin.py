from pydantic import BaseModel, Field
from decimal import Decimal
from typing import Optional
from datetime import date, datetime
from enum import Enum

class Originality(str, Enum):
  original = "original"
  replica = "replica"
  unknown = "unknown"

class Condition(str, Enum):
  flor_de_cunho = "flor_de_cunho"
  soberba = "soberba"
  mbc = "mbc"
  raro = "raro"
  bc = "bc"
  b = "b"
  other = "other"

class CoinBase(BaseModel):
  year: int
  country: str
  face_value: str
  purchase_price: Optional[Decimal] = None
  estimated_value: Optional[Decimal] = None
  originality: Originality = Originality.unknown
  condition: Condition = Condition.other
  condition_notes: Optional[str] = None
  storage_location: Optional[str] = None
  category: Optional[str] = None
  acquisition_date: Optional[date] = None
  acquisition_source: Optional[str] = None
  notes: Optional[str] = None
  image_url_front: Optional[str] = None
  image_url_back: Optional[str] = None
  currency: str = Field(default="BRL", min_length=3, max_length=3)

class CoinCreate(CoinBase):
  pass

class CoinUpdate(BaseModel):
  # todos opcionais para PATCH/PUT validado
  year: Optional[int] = None
  country: Optional[str] = None
  face_value: Optional[str] = None
  purchase_price: Optional[Decimal] = None
  estimated_value: Optional[Decimal] = None
  originality: Optional[Originality] = None
  condition: Optional[Condition] = None
  condition_notes: Optional[str] = None
  storage_location: Optional[str] = None
  category: Optional[str] = None
  acquisition_date: Optional[date] = None
  acquisition_source: Optional[str] = None
  notes: Optional[str] = None
  image_url_front: Optional[str] = None
  image_url_back: Optional[str] = None
  currency: Optional[str] = Field(default=None, min_length=3, max_length=3)

class CoinRead(CoinBase):
  id: int
  by_year: dict[int, int]
