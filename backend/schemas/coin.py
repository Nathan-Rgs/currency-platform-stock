from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator
from models.coin import OriginalityEnum

def _check_year(v):
    # bound evaluated at validation time, not import time
    if v is not None and v > datetime.now().year + 1:
        raise ValueError("year cannot be in the future")
    return v


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
    for_sale: bool = False
    sale_price: Optional[float] = Field(None, ge=0)
    public_description: Optional[str] = None
    catalog_ref: Optional[str] = Field(None, max_length=50)
    material: Optional[str] = Field(None, max_length=100)
    diameter_mm: Optional[float] = Field(None, ge=0)
    weight_g: Optional[float] = Field(None, ge=0)
    mint_mark: Optional[str] = Field(None, max_length=50)

    @field_validator("year")
    @classmethod
    def _year_not_future(cls, v):
        return _check_year(v)

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
    for_sale: Optional[bool] = None
    sale_price: Optional[float] = Field(None, ge=0)
    public_description: Optional[str] = None
    catalog_ref: Optional[str] = Field(None, max_length=50)
    material: Optional[str] = Field(None, max_length=100)
    diameter_mm: Optional[float] = Field(None, ge=0)
    weight_g: Optional[float] = Field(None, ge=0)
    mint_mark: Optional[str] = Field(None, max_length=50)

    @field_validator("year")
    @classmethod
    def _year_not_future(cls, v):
        return _check_year(v)

class CoinRead(BaseModelWithOrm, CoinBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime


class CoinPublic(BaseModelWithOrm):
    """Anonymous-safe coin view. Never add private fields here (see D2)."""
    id: int
    title: str
    quantity: int
    year: int
    country: str
    face_value: str
    originality: OriginalityEnum
    condition: Optional[str] = None
    category: Optional[str] = None
    catalog_ref: Optional[str] = None
    material: Optional[str] = None
    diameter_mm: Optional[float] = None
    weight_g: Optional[float] = None
    mint_mark: Optional[str] = None
    for_sale: bool
    sale_price: Optional[float] = None
    public_description: Optional[str] = None
    image_url_front: Optional[str] = None
    image_url_back: Optional[str] = None

    @model_validator(mode="after")
    def _hide_price_unless_for_sale(self):
        if not self.for_sale:
            self.sale_price = None
        return self


class CoinAdjust(BaseModel):
    delta_quantity: int
    note: str | None = None
