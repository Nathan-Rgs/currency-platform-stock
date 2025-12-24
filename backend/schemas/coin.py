from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from models.coin import OriginalityEnum

class BaseModelWithOrm(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
class CoinBase(BaseModel):
    title: str = Field(..., max_length=100, example="Moeda de 1 Real de 1994")
    quantity: int = Field(1, ge=1, description="Quantidade de moedas iguais.")
    year: int = Field(..., gt=0, example=1994, description="Ano de cunhagem da moeda.")
    country: str = Field(..., max_length=100, example="Brasil")
    face_value: str = Field(..., max_length=100, example="1 Real")
    purchase_price: Optional[float] = Field(None, ge=0, example=10.5)
    estimated_value: Optional[float] = Field(None, ge=0, example=25.0)
    originality: OriginalityEnum = OriginalityEnum.UNKNOWN
    condition: Optional[str] = Field(None, max_length=100, example="Flor de Cunho")
    storage_location: Optional[str] = Field(None, max_length=200, example="Álbum 1, p. 3")
    category: Optional[str] = Field(None, max_length=100, example="Comemorativa")
    acquisition_date: Optional[datetime] = None
    acquisition_source: Optional[str] = Field(None, max_length=200, example="Herança")
    notes: Optional[str] = Field(None, example="Moeda rara do plano Real.")
    image_url_front: Optional[str] = Field(None, max_length=500)
    image_url_back: Optional[str] = Field(None, max_length=500)

class CoinCreate(CoinBase):
    title: str = Field(..., max_length=100, example="Moeda de 1 Real de 1994")
    pass

class CoinUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=100)
    quantity: Optional[int] = Field(None, ge=1)
    year: Optional[int] = Field(None, gt=0)
    country: Optional[str] = Field(None, max_length=100)
    face_value: Optional[str] = Field(None, max_length=100)
    purchase_price: Optional[float] = Field(None, ge=0)
    estimated_value: Optional[float] = Field(None, ge=0)
    originality: Optional[OriginalityEnum] = None
    condition: Optional[str] = Field(None, max_length=100)
    storage_location: Optional[str] = Field(None, max_length=200)
    category: Optional[str] = Field(None, max_length=100)
    acquisition_date: Optional[datetime] = None
    acquisition_source: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = None
    image_url_front: Optional[str] = Field(None, max_length=500)
    image_url_back: Optional[str] = Field(None, max_length=500)

class CoinRead(BaseModelWithOrm, CoinBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime


class CoinAdjust(BaseModel):
    delta_quantity: int
    note: str | None = None
