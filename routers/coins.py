from typing import List, Optional
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Query,
    status,
)
from sqlalchemy.orm import Session
from sqlalchemy import func

from core.session import get_db
from models.coin import Coin, OriginalityEnum
from schemas.coin import CoinCreate, CoinUpdate, CoinRead
from schemas.common import PaginatedResponse, PaginationMeta
from core.security import get_current_user
from models.user import User
import os
from uuid import uuid4
from fastapi.responses import StreamingResponse, JSONResponse
import csv
import io
from datetime import datetime

router = APIRouter(prefix="/coins", tags=["coins"])


@router.post("", response_model=CoinRead, status_code=status.HTTP_201_CREATED)
def create_coin(
    coin_in: CoinCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coin = Coin(**coin_in.model_dump(), owner_id=current_user.id)
    db.add(coin)
    db.commit()
    db.refresh(coin)
    return coin

@router.get("", response_model=PaginatedResponse[CoinRead])
def list_coins(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    country: Optional[str] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    originality: Optional[OriginalityEnum] = None,
    condition: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Coin).filter(Coin.owner_id == current_user.id)

    if country:
        query = query.filter(Coin.country.ilike(f"%{country}%"))
    if year_from is not None:
        query = query.filter(Coin.year >= year_from)
    if year_to is not None:
        query = query.filter(Coin.year <= year_to)
    if originality:
        query = query.filter(Coin.originality == originality)
    if condition:
        query = query.filter(Coin.condition.ilike(f"%{condition}%"))
    if min_price is not None:
        query = query.filter(Coin.purchase_price >= min_price)
    if max_price is not None:
        query = query.filter(Coin.purchase_price <= max_price)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Coin.country.ilike(like))
            | (Coin.face_value.ilike(like))
            | (Coin.notes.ilike(like))
        )

    total_items = query.count()
    total_pages = (total_items + page_size - 1) // page_size

    coins = (
        query.order_by(Coin.year.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    meta = PaginationMeta(
        page=page,
        page_size=page_size,
        total_items=total_items,
        total_pages=total_pages,
    )

    return PaginatedResponse[CoinRead](
        data=coins,
        meta=meta,
    )


@router.get("/{coin_id}", response_model=CoinRead)
def get_coin(
    coin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coin = (
        db.query(Coin)
        .filter(Coin.id == coin_id, Coin.owner_id == current_user.id)
        .first()
    )
    if not coin:
        raise HTTPException(status_code=404, detail="Coin not found")
    return coin


@router.put("/{coin_id}", response_model=CoinRead)
def update_coin(
    coin_id: int,
    coin_in: CoinCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coin = db.query(Coin).filter(Coin.id == coin_id).first()
    if not coin:
        raise HTTPException(status_code=404, detail="Coin not found")

    for field, value in coin_in.model_dump().items():
        setattr(coin, field, value)

    db.commit()
    db.refresh(coin)
    return coin


@router.patch("/{coin_id}", response_model=CoinRead)
def partial_update_coin(
    coin_id: int,
    coin_in: CoinUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coin = db.query(Coin).filter(Coin.id == coin_id).first()
    if not coin:
        raise HTTPException(status_code=404, detail="Coin not found")

    data = coin_in.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(coin, field, value)

    db.commit()
    db.refresh(coin)
    return coin


@router.delete("/{coin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_coin(
    coin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coin = db.query(Coin).filter(Coin.id == coin_id).first()
    if not coin:
        raise HTTPException(status_code=404, detail="Coin not found")

    db.delete(coin)
    db.commit()
    return


MEDIA_DIR = "media/coins"
os.makedirs(MEDIA_DIR, exist_ok=True)

@router.post("/{coin_id}/upload-image", response_model=CoinRead)
async def upload_image(
    coin_id: int,
    front: Optional[UploadFile] = File(None),
    back: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coin = db.query(Coin).filter(Coin.id == coin_id).first()
    if not coin:
        raise HTTPException(status_code=404, detail="Coin not found")

    def save_file(file: UploadFile) -> str:
        ext = os.path.splitext(file.filename)[1]
        filename = f"{uuid4().hex}{ext}"
        path = os.path.join(MEDIA_DIR, filename)
        with open(path, "wb") as f:
            f.write(file.file.read())
        return f"/media/coins/{filename}"

    if front:
        coin.image_url_front = save_file(front)
    if back:
        coin.image_url_back = save_file(back)

    db.commit()
    db.refresh(coin)
    return coin


@router.post("/import")
async def import_coins(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()
    inserted = 0
    errors = 0

    if file.filename.endswith(".json"):
        import json

        try:
            data = json.loads(content)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON file")

        if not isinstance(data, list):
            raise HTTPException(status_code=400, detail="JSON must be a list of coins")

        for item in data:
            try:
                coin_in = CoinCreate(**item)
                coin = Coin(**coin_in.model_dump(), owner_id=current_user.id)
                db.add(coin)
                inserted += 1
            except Exception:
                errors += 1
        db.commit()

    elif file.filename.endswith(".csv"):
        text = content.decode("utf-8")
        reader = csv.DictReader(io.StringIO(text))
        for row in reader:
            try:
                # adaptar conversão de tipos conforme seu CSV
                if row.get("acquisition_date"):
                    row["acquisition_date"] = datetime.fromisoformat(
                        row["acquisition_date"]
                    )
                coin_in = CoinCreate(**row)
                coin = Coin(**coin_in.model_dump())
                db.add(coin)
                inserted += 1
            except Exception:
                errors += 1
        db.commit()
    else:
        raise HTTPException(status_code=400, detail="File must be .json or .csv")

    return {"inserted": inserted, "errors": errors}

@router.get("/export")
def export_coins(
    format: str = Query("json", pattern="^(json|csv)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coins = db.query(Coin).filter(Coin.owner_id == current_user.id).all()
    data = [CoinRead.model_validate(c).model_dump() for c in coins]

    if format == "json":
        return JSONResponse(content=data)

    # CSV
    fieldnames = list(data[0].keys()) if data else []
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for row in data:
        writer.writerow(row)
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="coins.csv"'},
    )
