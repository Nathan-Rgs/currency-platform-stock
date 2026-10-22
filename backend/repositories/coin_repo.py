from typing import Literal, Optional

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from models.coin import Coin, OriginalityEnum
from schemas.common import PaginatedResponse, PaginationMeta

CoinSort = Literal["year_desc", "year_asc", "created_desc", "title_asc"]

_SORTS = {
    "created_desc": (Coin.created_at.desc(), Coin.id.desc()),
    "year_desc": (Coin.year.desc(), Coin.id.desc()),
    "year_asc": (Coin.year.asc(), Coin.id.asc()),
    "title_asc": (Coin.title.asc(), Coin.id.asc()),
}


def apply_coin_filters(
    query: Select,
    *,
    search: Optional[str] = None,
    search_private: bool = False,
    country: Optional[str] = None,
    category: Optional[str] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    originality: Optional[OriginalityEnum] = None,
    for_sale: Optional[bool] = None,
    sort: CoinSort = "created_desc",
) -> Select:
    """Apply shared coin filters and ordering.

    `search_private` also matches private columns (notes); only owner-scoped
    routes may enable it, otherwise search becomes an oracle on private data.
    """
    if country:
        query = query.where(Coin.country.ilike(f"%{country}%"))
    if category:
        query = query.where(Coin.category == category)
    if year_from is not None:
        query = query.where(Coin.year >= year_from)
    if year_to is not None:
        query = query.where(Coin.year <= year_to)
    if originality:
        query = query.where(Coin.originality == originality)
    if for_sale is not None:
        query = query.where(Coin.for_sale == for_sale)
    if search:
        like = f"%{search}%"
        cols = [Coin.title, Coin.country, Coin.face_value, Coin.catalog_ref]
        if search_private:
            cols.append(Coin.notes)
        query = query.where(or_(*(c.ilike(like) for c in cols)))
    return query.order_by(*_SORTS[sort])


def paginate_coins(db: Session, query: Select, page: int, page_size: int) -> PaginatedResponse:
    total_items = db.scalar(select(func.count()).select_from(query.order_by(None).subquery())) or 0
    coins = db.execute(query.offset((page - 1) * page_size).limit(page_size)).scalars().all()
    meta = PaginationMeta(
        page=page,
        page_size=page_size,
        total_items=total_items,
        total_pages=(total_items + page_size - 1) // page_size,
    )
    return PaginatedResponse(data=coins, meta=meta)
