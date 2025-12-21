from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models import User, Coin
from models.audit_log import AuditLogAction, CoinAuditLog
from schemas.audit_log import CoinAuditLog as CoinAuditLogSchema, CoinAuditLogCreate
from schemas.common import PaginatedResponse, PaginationMeta
from schemas.coin import CoinAdjust, CoinRead
from services.audit_service import AuditService, get_audit_service

router = APIRouter(prefix="/admin", tags=["admin"])


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return current_user


def coin_to_dict(coin: Coin) -> dict:
    return CoinRead.model_validate(coin).model_dump(mode="json")


@router.post("/coins/{coin_id}/adjust", response_model=CoinRead)
def adjust_coin_quantity(
    coin_id: int,
    adjustment: CoinAdjust,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
    audit_service: AuditService = Depends(get_audit_service),
):
    coin = db.get(Coin, coin_id)
    if not coin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coin not found")

    before_state = coin_to_dict(coin)
    
    action = AuditLogAction.ADJUST_IN if adjustment.delta_quantity > 0 else AuditLogAction.ADJUST_OUT
    
    coin.quantity += adjustment.delta_quantity
    if coin.quantity < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity cannot be negative")

    db.commit()
    db.refresh(coin)
    after_state = coin_to_dict(coin)

    audit_log = CoinAuditLogCreate(
        action=action,
        before=before_state,
        after=after_state,
        coin_id=coin.id,
        delta_quantity=adjustment.delta_quantity,
        note=adjustment.note,
    )
    audit_service.create_audit_log(actor=admin_user, audit_log_in=audit_log)

    return coin


@router.get("/audit-logs", response_model=PaginatedResponse[CoinAuditLogSchema])
def list_audit_logs(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    action: Optional[AuditLogAction] = Query(None),
    coin_id: Optional[int] = Query(None),
    actor_email: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
):
    base_query = select(CoinAuditLog)

    if action:
        base_query = base_query.where(CoinAuditLog.action == action)
    if coin_id:
        base_query = base_query.where(CoinAuditLog.coin_id == coin_id)
    if actor_email:
        base_query = base_query.where(CoinAuditLog.actor_email.ilike(f"%{actor_email}%"))
    if date_from:
        base_query = base_query.where(CoinAuditLog.created_at >= date_from)
    if date_to:
        base_query = base_query.where(CoinAuditLog.created_at <= date_to)

    count_query = select(func.count()).select_from(base_query.subquery())
    total_items = db.scalar(count_query) or 0
    total_pages = (total_items + page_size - 1) // page_size

    items_query = (
        base_query.order_by(CoinAuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    audit_logs = db.execute(items_query).scalars().all()

    meta = PaginationMeta(page=page, page_size=page_size, total_items=total_items, total_pages=total_pages)
    return PaginatedResponse(data=audit_logs, meta=meta)
