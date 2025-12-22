from datetime import datetime
from pydantic import BaseModel, ConfigDict
from schemas.coin import CoinRead
from models.audit_log import AuditLogAction


class CoinAuditLogBase(BaseModel):
    action: AuditLogAction
    delta_quantity: int | None = None
    note: str | None = None
    before: dict | None = None
    after: dict | None = None


class CoinAuditLog(CoinAuditLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    coin_id: int | None = None
    actor_user_id: int | None = None
    actor_email: str | None = None
    created_at: datetime
    coin: CoinRead | None = None


class CoinAuditLogCreate(CoinAuditLogBase):
    coin_id: int
    
    pass
