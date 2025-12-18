import csv
import io
import os
import uuid
from datetime import datetime
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
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy import func, select, or_
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user
from models.coin import Coin, OriginalityEnum
from models.user import User
from schemas.coin import CoinCreate, CoinRead, CoinUpdate
from schemas.common import PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/coins", tags=["coins"])
MEDIA_DIR = "media/coins"


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
    current_user: User = Depends(get_current_user),
):
    coin = Coin(**coin_in.model_dump(), owner_id=current_user.id)
    db.add(coin)
    db.commit()
    db.refresh(coin)
    return coin


@router.get("", response_model=PaginatedResponse[CoinRead])
def list_coins(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    country: Optional[str] = Query(None),
    year_from: Optional[int] = Query(None),
    year_to: Optional[int] = Query(None),
    originality: Optional[OriginalityEnum] = Query(None),
    search: Optional[str] = Query(None, description="Search in country, value, and notes"),
):
    base_query = select(Coin).where(Coin.owner_id == current_user.id)

    if country:
        base_query = base_query.where(Coin.country.ilike(f"%{country}%"))
    if year_from is not None:
        base_query = base_query.where(Coin.year >= year_from)
    if year_to is not None:
        base_query = base_query.where(Coin.year <= year_to)
    if originality:
        base_query = base_query.where(Coin.originality == originality)
    if search:
        like = f"%{search}%"
        base_query = base_query.where(
            or_(Coin.country.ilike(like), Coin.face_value.ilike(like), Coin.notes.ilike(like))
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

    meta = PaginationMeta(page=page, page_size=page_size, total_items=total_items, total_pages=total_pages)
    return PaginatedResponse(data=coins, meta=meta)


@router.get("/{coin_id}", response_model=CoinRead)
def get_coin_by_id(
    coin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coin = get_coin_or_404(db, coin_id, current_user.id)
    return coin


@router.put("/{coin_id}", response_model=CoinRead)
def update_coin(
    coin_id: int,
    coin_in: CoinCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    coin = get_coin_or_404(db, coin_id, current_user.id)
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
    coin = get_coin_or_404(db, coin_id, current_user.id)
    update_data = coin_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
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
    coin = get_coin_or_404(db, coin_id, current_user.id)
    db.delete(coin)
    db.commit()
    return


@router.post("/{coin_id}/upload-image", response_model=CoinRead)
def upload_coin_image(
    coin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    front_image: UploadFile | None = File(None),
    back_image: UploadFile | None = File(None),
):
    if not front_image and not back_image:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "At least one image is required.")

    coin = get_coin_or_404(db, coin_id, current_user.id)

    def save_file(file: UploadFile) -> str:
        os.makedirs(MEDIA_DIR, exist_ok=True)
        ext = os.path.splitext(file.filename)[-1]
        filename = f"{uuid.uuid4().hex}{ext}"
        path = os.path.join(MEDIA_DIR, filename)
        with open(path, "wb") as f:
            f.write(file.file.read())
        return f"/{path.replace(os.sep, '/')}"

    if front_image:
        coin.image_url_front = save_file(front_image)
    if back_image:
        coin.image_url_back = save_file(back_image)

    db.commit()
    db.refresh(coin)
    return coin


@router.post("/import")
def import_from_file(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = file.file.read()
    inserted, errors = 0, 0

    try:
        if file.filename.endswith(".json"):
            import json
            data = json.loads(content)
            for item in data:
                try:
                    coin_in = CoinCreate(**item)
                    db.add(Coin(**coin_in.model_dump(), owner_id=current_user.id))
                    inserted += 1
                except Exception:
                    errors += 1
        elif file.filename.endswith(".csv"):
            reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
            for row in reader:
                try:
                    # Implement robust type conversion for CSV data
                    if p := row.get("purchase_price"): row["purchase_price"] = float(p)
                    if e := row.get("estimated_value"): row["estimated_value"] = float(e)
                    if y := row.get("year"): row["year"] = int(y)
                    if d := row.get("acquisition_date"): row["acquisition_date"] = datetime.fromisoformat(d)
                    
                    coin_in = CoinCreate(**row)
                    db.add(Coin(**coin_in.model_dump(), owner_id=current_user.id))
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


@router.get("/export/all")
def export_to_file(
    format: str = Query("json", enum=["json", "csv"]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Coin).where(Coin.owner_id == current_user.id)
    coins = db.execute(query).scalars().all()
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
