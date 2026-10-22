from fastapi import APIRouter, Depends
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_active_user
from models.user import User
from models.coin import Coin, OriginalityEnum
from schemas.coin import CoinRead

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    own = Coin.owner_id == current_user.id

    def count_where(cond):
        return func.coalesce(func.sum(case((cond, 1), else_=0)), 0)

    totals = db.execute(
        select(
            func.count(Coin.id),
            func.coalesce(func.sum(Coin.quantity), 0),
            func.count(func.distinct(Coin.country)),
            count_where(Coin.originality == OriginalityEnum.ORIGINAL),
            count_where(Coin.originality == OriginalityEnum.REPLICA),
            count_where(Coin.for_sale.is_(True)),
            func.coalesce(func.sum(Coin.estimated_value * Coin.quantity), 0),
            func.coalesce(func.sum(Coin.purchase_price * Coin.quantity), 0),
        ).where(own)
    ).one()

    by_category = db.execute(
        select(Coin.category, func.count(Coin.id).label("count"))
        .where(own, Coin.category.is_not(None))
        .group_by(Coin.category)
        .order_by(func.count(Coin.id).desc(), Coin.category)
    ).mappings().all()

    recent = db.scalars(
        select(Coin)
        .where(own)
        .order_by(Coin.created_at.desc(), Coin.id.desc())
        .limit(5)
    ).all()

    by_country_q = (
        select(Coin.country, func.count(Coin.id).label("count"))
        .where(Coin.owner_id == current_user.id)
        .group_by(Coin.country)
        .order_by(func.count(Coin.id).desc())
    )
    by_country = db.execute(by_country_q).mappings().all()

    by_year_q = (
        select(Coin.year, func.count(Coin.id).label("count"))
        .where(Coin.owner_id == current_user.id)
        .group_by(Coin.year)
        .order_by(Coin.year.asc())
    )
    by_year = db.execute(by_year_q).mappings().all()

    by_originality_q = (
        select(Coin.originality, func.count(Coin.id).label("count"))
        .where(Coin.owner_id == current_user.id)
        .group_by(Coin.originality)
        .order_by(func.count(Coin.id).desc())
    )
    by_originality = db.execute(by_originality_q).mappings().all()

    return {
        "total_items": totals[0],
        "total_pieces": totals[1],
        "total_countries": totals[2],
        "total_originals": totals[3],
        "total_replicas": totals[4],
        "total_for_sale": totals[5],
        "total_estimated_value": float(totals[6]),
        "total_invested": float(totals[7]),
        "by_country": by_country,
        "by_year": by_year,
        "by_originality": [
            {
                "originality": (
                    row["originality"].value
                    if hasattr(row["originality"], "value")
                    else row["originality"]
                ),
                "count": row["count"],
            }
            for row in by_originality
        ],
        "by_category": by_category,
        "recent": [CoinRead.model_validate(c).model_dump(mode="json") for c in recent],
    }
