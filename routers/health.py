from fastapi import APIRouter
from core.config import settings

router = APIRouter()

@router.get("/", tags=["Health"])
def health_check():
    """
    Endpoint de health check para verificar se a aplicação está no ar.
    """
    return {"status": "ok", "app_name": settings.PROJECT_NAME}
