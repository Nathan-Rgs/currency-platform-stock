from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.coin import Coin, OriginalityEnum

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Coin).where(Coin.owner_id == current_user.id)

    total_coins = db.scalar(select(func.count()).select_from(q.subquery())) or 0
    total_countries = (
        db.scalar(
            select(func.count(func.distinct(Coin.country))).select_from(q.subquery())
        )
        or 0
    )

    q_originals = q.where(Coin.originality == OriginalityEnum.ORIGINAL)
    total_originals = db.scalar(select(func.count()).select_from(q_originals.subquery())) or 0

    q_replicas = q.where(Coin.originality == OriginalityEnum.REPLICA)
    total_replicas = db.scalar(select(func.count()).select_from(q_replicas.subquery())) or 0

    total_estimated_value = (
        db.scalar(select(func.sum(Coin.estimated_value)).select_from(q.subquery()))
        or 0.0
    )

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
        "total_coins": total_coins,
        "total_countries": total_countries,
        "total_originals": total_originals,
        "total_replicas": total_replicas,
        "total_estimated_value": total_estimated_value,
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
    }
