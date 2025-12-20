# routers/coins.py

import csv
import io
import json
from datetime import datetime
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
    UploadFile,
    File,
    Form,
)
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session

from core.database import get_db
from core.storage import create_signed_url
from models.coin import OriginalityEnum, Coin
from schemas.coin import CoinCreate, CoinRead, CoinUpdate
from schemas.common import PaginatedResponse, PaginationMeta
from services import coin_service

router = APIRouter(prefix="/coins", tags=["coins"])

SIGNED_URL_TTL = 60 * 60  # 1h

def _validate_image_upload(file: UploadFile | None, field_name: str) -> None:
    if not file:
        return
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type for {field_name}. Only images are allowed.",
        )


def _to_signed_url(value: Optional[str]) -> Optional[str]:
    """
    Converte o que estiver salvo no banco em URL utilizável:
    - Se já for http(s), retorna como está (compatibilidade com bucket público/antigo)
    - Se for um path/key (ex.: 'coins/4/abc.jpg' ou 'abc.jpg'), gera signed URL
    - Se for vazio/'string', retorna None
    """
    if not value:
        return None

    v = str(value).strip()
    if not v or v.lower() == "string":
        return None

    if v.startswith("http://") or v.startswith("https://"):
        return v

    return create_signed_url(v, expires_in=SIGNED_URL_TTL)


def _attach_signed_urls(coin: Coin) -> Coin:
    """
    Preenche coin.image_url_front/back com signed URLs em memória (não persiste no banco).
    """
    try:
        coin.image_url_front = _to_signed_url(getattr(coin, "image_url_front", None))
        coin.image_url_back = _to_signed_url(getattr(coin, "image_url_back", None))
    except Exception:
        coin.image_url_front = None
        coin.image_url_back = None
    return coin


def _build_coin_update_from_form(
    *,
    quantity: Optional[int] = None,
    year: Optional[int] = None,
    country: Optional[str] = None,
    face_value: Optional[str] = None,
    purchase_price: Optional[float] = None,
    estimated_value: Optional[float] = None,
    originality: Optional[OriginalityEnum] = None,
    condition: Optional[str] = None,
    storage_location: Optional[str] = None,
    category: Optional[str] = None,
    acquisition_date: Optional[datetime] = None,
    acquisition_source: Optional[str] = None,
    notes: Optional[str] = None,
) -> CoinUpdate:
    """
    Monta CoinUpdate SOMENTE com campos enviados (remove None),
    para evitar sobrescrever campos existentes com NULL em updates multipart/form-data.
    """
    data = {
        "quantity": quantity,
        "year": year,
        "country": country,
        "face_value": face_value,
        "purchase_price": purchase_price,
        "estimated_value": estimated_value,
        "originality": originality,
        "condition": condition,
        "storage_location": storage_location,
        "category": category,
        "acquisition_date": acquisition_date,
        "acquisition_source": acquisition_source,
        "notes": notes,
    }
    data = {k: v for k, v in data.items() if v is not None}
    return CoinUpdate(**data)


@router.post("", response_model=CoinRead, status_code=status.HTTP_201_CREATED)
async def create_coin(
    coin_in: CoinCreate = Depends(),
    front_image: UploadFile = File(...),
    back_image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    _validate_image_upload(front_image, "front_image")
    _validate_image_upload(back_image, "back_image")

    coin = await coin_service.create_coin(
        db=db,
        coin_data=coin_in,
        front_image=front_image,
        back_image=back_image,
    )
    return _attach_signed_urls(coin)


@router.get("", response_model=PaginatedResponse[CoinRead])
def list_coins(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    country: Optional[str] = Query(None),
    year_from: Optional[int] = Query(None),
    year_to: Optional[int] = Query(None),
    originality: Optional[OriginalityEnum] = Query(None),
    search: Optional[str] = Query(None, description="Search in country, value, and notes"),
):
    from sqlalchemy import func, select, or_

    base_query = select(Coin)

    if country:
        base_query = base_query.where(Coin.country.ilike(f"%{country}%"))
    if year_from is not None:
        base_query = base_query.where(Coin.year >= year_from)
    if year_to is not None:
        base_query = base_query.where(Coin.year <= year_to)
    if originality:
        base_query = base_query.where(Coin.originality == originality)
    if search:
        like_term = f"%{search}%"
        base_query = base_query.where(
            or_(
                Coin.country.ilike(like_term),
                Coin.face_value.ilike(like_term),
                Coin.notes.ilike(like_term),
            )
        )

    count_query = select(func.count()).select_from(base_query.subquery())
    total_items = db.scalar(count_query) or 0
    total_pages = (total_items + page_size - 1) // page_size

    items_query = (
        base_query.order_by(Coin.year.desc(), Coin.country)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    coins = db.execute(items_query).scalars().all()
    coins = [_attach_signed_urls(c) for c in coins]

    meta = PaginationMeta(
        page=page,
        page_size=page_size,
        total_items=total_items,
        total_pages=total_pages,
    )
    return PaginatedResponse(data=coins, meta=meta)


@router.get("/{coin_id}", response_model=CoinRead)
def get_coin_by_id(coin_id: int, db: Session = Depends(get_db)):
    coin = coin_service.get_coin_by_id(db, coin_id)
    if not coin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coin not found")
    return _attach_signed_urls(coin)


@router.put("/{coin_id}", response_model=CoinRead)
async def update_coin(
    coin_id: int,
    # campos do form (multipart/form-data)
    quantity: Optional[int] = Form(None),
    year: Optional[int] = Form(None),
    country: Optional[str] = Form(None),
    face_value: Optional[str] = Form(None),
    purchase_price: Optional[float] = Form(None),
    estimated_value: Optional[float] = Form(None),
    originality: Optional[OriginalityEnum] = Form(None),
    condition: Optional[str] = Form(None),
    storage_location: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    acquisition_date: Optional[datetime] = Form(None),
    acquisition_source: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    # arquivos
    front_image: UploadFile | None = File(None),
    back_image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    _validate_image_upload(front_image, "front_image")
    _validate_image_upload(back_image, "back_image")

    coin_in = _build_coin_update_from_form(
        quantity=quantity,
        year=year,
        country=country,
        face_value=face_value,
        purchase_price=purchase_price,
        estimated_value=estimated_value,
        originality=originality,
        condition=condition,
        storage_location=storage_location,
        category=category,
        acquisition_date=acquisition_date,
        acquisition_source=acquisition_source,
        notes=notes,
    )

    updated_coin = await coin_service.update_coin(
        db=db,
        coin_id=coin_id,
        coin_update=coin_in,
        front_image=front_image,
        back_image=back_image,
        partial=False,
    )
    if not updated_coin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coin not found or failed to update.")
    return _attach_signed_urls(updated_coin)


@router.patch("/{coin_id}", response_model=CoinRead, summary="Partially update a coin")
async def partial_update_coin(
    coin_id: int,
    # campos do form (multipart/form-data)
    quantity: Optional[int] = Form(None),
    year: Optional[int] = Form(None),
    country: Optional[str] = Form(None),
    face_value: Optional[str] = Form(None),
    purchase_price: Optional[float] = Form(None),
    estimated_value: Optional[float] = Form(None),
    originality: Optional[OriginalityEnum] = Form(None),
    condition: Optional[str] = Form(None),
    storage_location: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    acquisition_date: Optional[datetime] = Form(None),
    acquisition_source: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    # arquivos
    front_image: UploadFile | None = File(None),
    back_image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    _validate_image_upload(front_image, "front_image")
    _validate_image_upload(back_image, "back_image")

    coin_in = _build_coin_update_from_form(
        quantity=quantity,
        year=year,
        country=country,
        face_value=face_value,
        purchase_price=purchase_price,
        estimated_value=estimated_value,
        originality=originality,
        condition=condition,
        storage_location=storage_location,
        category=category,
        acquisition_date=acquisition_date,
        acquisition_source=acquisition_source,
        notes=notes,
    )

    updated_coin = await coin_service.update_coin(
        db=db,
        coin_id=coin_id,
        coin_update=coin_in,
        front_image=front_image,
        back_image=back_image,
        partial=True,
    )
    if not updated_coin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coin not found or failed to update.")
    return _attach_signed_urls(updated_coin)


@router.post("/{coin_id}/upload-images", response_model=CoinRead)
async def upload_images(
    coin_id: int,
    front_image: UploadFile | None = File(None),
    back_image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    _validate_image_upload(front_image, "front_image")
    _validate_image_upload(back_image, "back_image")

    if not front_image and not back_image:
        raise HTTPException(status_code=400, detail="Envie ao menos uma imagem.")

    updated_coin = await coin_service.update_coin(
        db=db,
        coin_id=coin_id,
        coin_update=CoinUpdate(),  # vazio, não altera campos
        front_image=front_image,
        back_image=back_image,
        partial=True,
    )
    if not updated_coin:
        raise HTTPException(status_code=404, detail="Coin not found")

    return _attach_signed_urls(updated_coin)


@router.delete("/{coin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_coin(coin_id: int, db: Session = Depends(get_db)):
    deleted_coin = coin_service.delete_coin(db, coin_id)
    if not deleted_coin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coin not found")
    return None


@router.post("/import", summary="Import coins from JSON or CSV file")
def import_from_file(
    file: UploadFile,
    db: Session = Depends(get_db),
):
    content = file.file.read()
    inserted, errors = 0, 0

    try:
        if file.filename.endswith(".json"):
            data = json.loads(content)
            for item in data:
                try:
                    coin_in = CoinCreate(**item)
                    coin = Coin(**coin_in.model_dump())
                    db.add(coin)
                    inserted += 1
                except Exception:
                    errors += 1
        elif file.filename.endswith(".csv"):
            reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
            for row in reader:
                try:
                    if p := row.get("purchase_price"):
                        row["purchase_price"] = float(p)
                    if e := row.get("estimated_value"):
                        row["estimated_value"] = float(e)
                    if y := row.get("year"):
                        row["year"] = int(y)
                    if d := row.get("acquisition_date"):
                        row["acquisition_date"] = datetime.fromisoformat(d)

                    coin_in = CoinCreate(**row)
                    coin = Coin(**coin_in.model_dump())
                    db.add(coin)
                    inserted += 1
                except (ValueError, TypeError):
                    errors += 1
        else:
            raise HTTPException(400, "Invalid file format. Use .json or .csv.")

        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Import failed: {e}")

    return {"inserted": inserted, "errors": errors}


@router.get("/export/all", summary="Export all coins to JSON or CSV")
def export_to_file(
    format: str = Query("json", enum=["json", "csv"]),
    db: Session = Depends(get_db),
):
    from sqlalchemy import select

    query = select(Coin)
    coins = db.execute(query).scalars().all()

    coins = [_attach_signed_urls(c) for c in coins]
    data = [CoinRead.model_validate(c).model_dump(mode="json") for c in coins]

    if format == "json":
        return JSONResponse(content=data)

    if not data:
        return StreamingResponse(iter([""]), media_type="text/csv")

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=data[0].keys())
    writer.writeheader()
    writer.writerows(data)
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="coins.csv"'},
    )
