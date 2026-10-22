from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.database import get_db
from models.coin import Coin, OriginalityEnum
from repositories.coin_repo import CoinSort, apply_coin_filters, paginate_coins
from schemas.coin import CoinPublic
from schemas.common import PaginatedResponse

# Anonymous showcase: single-owner collection, so every coin is listed.
# Responses must only ever use CoinPublic (no private fields, D2).
router = APIRouter(prefix="/public", tags=["public"])


@router.get("/coins", response_model=PaginatedResponse[CoinPublic])
def list_public_coins(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=48),
    search: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    year_from: Optional[int] = Query(None),
    year_to: Optional[int] = Query(None),
    originality: Optional[OriginalityEnum] = Query(None),
    for_sale: Optional[bool] = Query(None),
    sort: CoinSort = Query("created_desc"),
):
    query = apply_coin_filters(
        select(Coin),
        search=search,
        country=country,
        category=category,
        year_from=year_from,
        year_to=year_to,
        originality=originality,
        for_sale=for_sale,
        sort=sort,
    )
    return paginate_coins(db, query, page, page_size)


@router.get("/coins/{coin_id}", response_model=CoinPublic)
def get_public_coin(coin_id: int, db: Session = Depends(get_db)):
    coin = db.get(Coin, coin_id)
    if not coin:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Coin not found")
    return coin


@router.get("/facets")
def get_facets(db: Session = Depends(get_db)):
    def distinct(col):
        return list(db.scalars(select(col).where(col.is_not(None)).distinct().order_by(col)))

    year_min, year_max = db.execute(select(func.min(Coin.year), func.max(Coin.year))).one()
    return {
        "countries": distinct(Coin.country),
        "categories": distinct(Coin.category),
        "year_min": year_min,
        "year_max": year_max,
    }
