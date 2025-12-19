import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.config import settings
from routers import auth, coins, dashboard, health

MEDIA_DIR = "media"

# Context manager para eventos de startup e shutdown da aplicação.
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("INFO:     Iniciando a aplicação...")
    os.makedirs(os.path.join(MEDIA_DIR, "coins"), exist_ok=True)
    print(f"INFO:     Diretório de mídia '{MEDIA_DIR}/coins' verificado/criado.")
    yield
    print("INFO:     Encerrando a aplicação...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    lifespan=lifespan,
)

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.mount(f"/{MEDIA_DIR}", StaticFiles(directory=MEDIA_DIR), name="media")

api_router = APIRouter(prefix=settings.API_V1_PREFIX)
api_router.include_router(auth.router)
api_router.include_router(coins.router)
api_router.include_router(dashboard.router)

app.include_router(health.router)
app.include_router(api_router)
