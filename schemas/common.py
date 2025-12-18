from pydantic import BaseModel, ConfigDict
from typing import Generic, TypeVar, List


T = TypeVar("T")


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int


class PaginatedResponse(BaseModel, Generic[T]):
    model_config = ConfigDict(from_attributes=True)

    data: List[T]
    meta: PaginationMeta
