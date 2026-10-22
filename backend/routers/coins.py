import csv
import io
import json
from datetime import date
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
    UploadFile,
    File,
)
from fastapi.responses import JSONResponse, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_active_user
from core.storage import delete_media, save_image
from models.coin import Coin, OriginalityEnum
from models.user import User
from schemas.coin import CoinCreate, CoinRead, CoinUpdate
from services.coin_import import ImportFileError, TEMPLATE_COLUMNS, build_coins, decode, parse_csv
from schemas.common import PaginatedResponse
from repositories.coin_repo import CoinSort, apply_coin_filters, paginate_coins

router = APIRouter(prefix="/coins", tags=["coins"])
MEDIA_DIR = "media/coins"

from services.audit_service import AuditService, get_audit_service
from schemas.audit_log import CoinAuditLogCreate
from models.audit_log import AuditLogAction

def get_coin_or_404(db: Session, coin_id: int, user_id: int) -> Coin:
    """Busca uma moeda pelo ID, garantindo que ela pertença ao usuário. Falha com 404 caso contrário."""
    query = select(Coin).where(Coin.id == coin_id, Coin.owner_id == user_id)
    coin = db.execute(query).scalars().first()
    if not coin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Coin not found"
        )
    return coin

@router.post("", response_model=CoinRead, status_code=status.HTTP_201_CREATED)
def create_coin(
    coin_in: CoinCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    audit_service: AuditService = Depends(get_audit_service),
):
    coin = Coin(**coin_in.model_dump(), owner_id=current_user.id)
    db.add(coin)
    db.commit()
    db.refresh(coin)

    audit_log = CoinAuditLogCreate(
        action=AuditLogAction.CREATE,
        after=CoinRead.model_validate(coin).model_dump(mode="json"),
        coin_id=coin.id,
        delta_quantity=coin.quantity,
    )
    audit_service.create_audit_log(actor=current_user, audit_log_in=audit_log)

    return coin


@router.get("", response_model=PaginatedResponse[CoinRead])
def list_coins(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    country: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    year_from: Optional[int] = Query(None),
    year_to: Optional[int] = Query(None),
    originality: Optional[OriginalityEnum] = Query(None),
    for_sale: Optional[bool] = Query(None),
    sort: CoinSort = Query("created_desc"),
    search: Optional[str] = Query(None, description="Search in title, country, value, catalog ref and notes"),
):
    query = apply_coin_filters(
        select(Coin).where(Coin.owner_id == current_user.id),
        search=search,
        search_private=True,
        country=country,
        category=category,
        year_from=year_from,
        year_to=year_to,
        originality=originality,
        for_sale=for_sale,
        sort=sort,
    )
    return paginate_coins(db, query, page, page_size)


@router.get("/{coin_id}", response_model=CoinRead)
def get_coin_by_id(
    coin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return get_coin_or_404(db, coin_id, current_user.id)


def coin_to_dict(coin: Coin) -> dict:
    return CoinRead.model_validate(coin).model_dump(mode="json")

@router.put("/{coin_id}", response_model=CoinRead)
def update_coin(
    coin_id: int,
    coin_in: CoinCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    audit_service: AuditService = Depends(get_audit_service),
):
    coin = get_coin_or_404(db, coin_id, current_user.id)
    before_state = coin_to_dict(coin)
    delta_quantity = coin_in.quantity - coin.quantity

    for field, value in coin_in.model_dump().items():
        setattr(coin, field, value)
    
    db.commit()
    db.refresh(coin)
    after_state = coin_to_dict(coin)

    audit_log = CoinAuditLogCreate(
        action=AuditLogAction.UPDATE,
        before=before_state,
        after=after_state,
        coin_id=coin.id,
        delta_quantity=delta_quantity,
    )
    audit_service.create_audit_log(actor=current_user, audit_log_in=audit_log)

    return coin


@router.patch("/{coin_id}", response_model=CoinRead)
def partial_update_coin(
    coin_id: int,
    coin_in: CoinUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    audit_service: AuditService = Depends(get_audit_service),
):
    coin = get_coin_or_404(db, coin_id, current_user.id)
    before_state = coin_to_dict(coin)
    update_data = coin_in.model_dump(exclude_unset=True)
    
    delta_quantity = None
    if "quantity" in update_data:
        delta_quantity = update_data["quantity"] - coin.quantity

    for field, value in update_data.items():
        setattr(coin, field, value)

    db.commit()
    db.refresh(coin)
    after_state = coin_to_dict(coin)

    audit_log = CoinAuditLogCreate(
        action=AuditLogAction.UPDATE,
        before=before_state,
        after=after_state,
        coin_id=coin.id,
        delta_quantity=delta_quantity,
    )
    audit_service.create_audit_log(actor=current_user, audit_log_in=audit_log)

    return coin


@router.delete("/{coin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_coin(
    coin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    audit_service: AuditService = Depends(get_audit_service),
):
    coin = get_coin_or_404(db, coin_id, current_user.id)
    before_state = coin_to_dict(coin)
    delta_quantity = -coin.quantity

    audit_log = CoinAuditLogCreate(
        action=AuditLogAction.DELETE,
        before=before_state,
        coin_id=coin.id,
        delta_quantity=delta_quantity,
    )
    audit_service.create_audit_log(actor=current_user, audit_log_in=audit_log)

    front, back = coin.image_url_front, coin.image_url_back
    db.delete(coin)
    db.commit()
    delete_media(front, MEDIA_DIR)
    delete_media(back, MEDIA_DIR)
    return


@router.post("/{coin_id}/upload-images", response_model=CoinRead)
def upload_coin_image(
    coin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    front_image: UploadFile | None = File(None),
    back_image: UploadFile | None = File(None),
):
    if not front_image and not back_image:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "At least one image is required.")

    coin = get_coin_or_404(db, coin_id, current_user.id)

    old = {"front": coin.image_url_front, "back": coin.image_url_back}
    saved = []
    try:
        if front_image:
            coin.image_url_front = save_image(front_image, MEDIA_DIR)
            saved.append(coin.image_url_front)
        if back_image:
            coin.image_url_back = save_image(back_image, MEDIA_DIR)
            saved.append(coin.image_url_back)
        db.commit()
    except BaseException:
        db.rollback()
        for url in saved:
            delete_media(url, MEDIA_DIR)
        raise

    if front_image:
        delete_media(old["front"], MEDIA_DIR)
    if back_image:
        delete_media(old["back"], MEDIA_DIR)
    db.commit()
    db.refresh(coin)
    return coin


@router.get("/import/template")
def import_template(current_user: User = Depends(get_current_active_user)):
    return _csv_response(TEMPLATE_COLUMNS, [], "modelo-importacao.csv")


@router.post("/import")
def import_from_file(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    audit_service: AuditService = Depends(get_audit_service),
):
    name = (file.filename or "").lower()
    if not name.endswith((".json", ".csv")):
        raise HTTPException(400, "Invalid file format. Use .json or .csv.")
    try:
        text = decode(file.file.read())
        if name.endswith(".json"):
            rows, normalize = json.loads(text), False
            if not isinstance(rows, list):
                raise ImportFileError("JSON deve ser uma lista de moedas.")
        else:
            rows, normalize = parse_csv(text), True
    except (ImportFileError, ValueError, csv.Error) as exc:
        raise HTTPException(400, f"Não foi possível ler o arquivo: {exc}")

    coins_in, errors = build_coins(rows, normalize)
    coins = [Coin(**c.model_dump(), owner_id=current_user.id) for c in coins_in]
    try:
        if coins:
            db.add_all(coins)
            db.commit()
            for coin in coins:
                db.refresh(coin)
                audit_log = CoinAuditLogCreate(
                    action=AuditLogAction.IMPORT,
                    after=coin_to_dict(coin),
                    coin_id=coin.id,
                    delta_quantity=coin.quantity,
                )
                audit_service.create_audit_log(actor=current_user, audit_log_in=audit_log)
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Import failed: {e}")

    return {"inserted": len(coins), "errors": errors}


def _csv_response(columns, rows, filename: str) -> Response:
    out = io.StringIO()
    writer = csv.DictWriter(out, fieldnames=columns, delimiter=";", extrasaction="ignore")
    writer.writeheader()
    # pt-BR Excel reads "10,5" as a number, "10.5" as text.
    writer.writerows(
        {k: (str(v).replace(".", ",") if isinstance(v, float) else v) for k, v in r.items()} for r in rows
    )
    return Response(
        out.getvalue().encode("utf-8-sig"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/all")
def export_to_file(
    format: str = Query("json", enum=["json", "csv"]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(Coin).where(Coin.owner_id == current_user.id)
    coins = db.execute(query).scalars().all()
    data = [CoinRead.model_validate(c).model_dump(mode="json") for c in coins]
    stamp = date.today().isoformat()

    if format == "json":
        return JSONResponse(
            content=data,
            headers={"Content-Disposition": f'attachment; filename="colecao-{stamp}.json"'},
        )
    return _csv_response(list(CoinRead.model_fields), data, f"colecao-{stamp}.csv")
