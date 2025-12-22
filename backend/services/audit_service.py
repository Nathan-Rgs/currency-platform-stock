from sqlalchemy.orm import Session
from core.database import get_db
from models import CoinAuditLog, User
from schemas.audit_log import CoinAuditLogCreate


class AuditService:
    def __init__(self, db: Session):
        self.db = db

    def create_audit_log(self, *, actor: User, audit_log_in: CoinAuditLogCreate) -> CoinAuditLog:
        audit_log = CoinAuditLog(
            **audit_log_in.model_dump(),
            actor_user_id=actor.id,
            actor_email=actor.email,
        )
        self.db.add(audit_log)
        self.db.commit()
        self.db.refresh(audit_log)
        return audit_log


from fastapi import Depends
from sqlalchemy.orm import Session

def get_audit_service(db: Session = Depends(get_db)) -> AuditService:
    return AuditService(db)
