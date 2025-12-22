from datetime import datetime
import enum
from typing import TYPE_CHECKING
from sqlalchemy import (
    DateTime,
    Enum,
    Integer,
    String,
    Text,
    func,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base

if TYPE_CHECKING:
    from .user import User
    from .coin import Coin


class AuditLogAction(str, enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    IMPORT = "import"
    ADJUST_IN = "adjust_in"
    ADJUST_OUT = "adjust_out"


class CoinAuditLog(Base):
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    coin_id: Mapped[int | None] = mapped_column(
        ForeignKey("coins.id", ondelete="SET NULL"), index=True
    )
    action: Mapped[AuditLogAction] = mapped_column(
        Enum(AuditLogAction), index=True, nullable=False
    )
    delta_quantity: Mapped[int | None] = mapped_column(Integer)
    before: Mapped[dict | None] = mapped_column(JSON)
    after: Mapped[dict | None] = mapped_column(JSON)
    note: Mapped[str | None] = mapped_column(Text)
    actor_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    actor_email: Mapped[str | None] = mapped_column(String(320))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    coin: Mapped["Coin"] = relationship()
    actor: Mapped["User"] = relationship()
