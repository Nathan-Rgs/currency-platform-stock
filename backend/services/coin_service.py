from __future__ import annotations

from fastapi import UploadFile
from sqlalchemy.orm import Session

from core.storage import delete_file, save_file
from models.coin import Coin
from repositories import coin_repo
from schemas.coin import CoinCreate, CoinUpdate


def get_all_coins(db: Session, skip: int = 0, limit: int = 100):
    return coin_repo.get_all_coins(db, skip=skip, limit=limit)


async def create_coin(
    db: Session,
    coin_data: CoinCreate,
    front_image: UploadFile,
    back_image: UploadFile | None = None,
) -> Coin:
    # save_file retorna (signed_url, path) quando return_path=True
    front_signed_url, front_path = await save_file(front_image, folder="coins", return_path=True)

    back_signed_url = None
    back_path = None
    if back_image:
        back_signed_url, back_path = await save_file(back_image, folder="coins", return_path=True)

    new_coin = Coin(
        **coin_data.model_dump(),
        # no banco fica o PATH (ex.: coins/<uuid>.jpg)
        image_url_front=front_path,
        image_url_back=back_path,
    )

    created = coin_repo.create_coin(db, new_coin)

    # opcional: já devolver URLs válidas no retorno imediato (sem persistir)
    created.image_url_front = front_signed_url
    created.image_url_back = back_signed_url

    return created


def get_coin_by_id(db: Session, coin_id: int) -> Coin | None:
    return coin_repo.get_coin_by_id(db, coin_id)


async def update_coin(
    db: Session,
    coin_id: int,
    coin_update: CoinUpdate,
    front_image: UploadFile | None = None,
    back_image: UploadFile | None = None,
    *,
    partial: bool = True,
) -> Coin | None:
    db_coin = coin_repo.get_coin_by_id(db, coin_id)
    if not db_coin:
        return None

    # guarda paths antigos
    old_front_path = db_coin.image_url_front
    old_back_path = db_coin.image_url_back

    ... # aplica update_data

    new_front_path = None
    new_back_path = None
    front_signed_url = None
    back_signed_url = None

    if front_image:
        front_signed_url, new_front_path = await save_file(front_image, folder="coins", return_path=True)
        db_coin.image_url_front = new_front_path  # salva path

    if back_image:
        back_signed_url, new_back_path = await save_file(back_image, folder="coins", return_path=True)
        db_coin.image_url_back = new_back_path  # salva path

    updated = coin_repo.update_coin(db, db_coin)

    # apaga arquivos antigos (só se realmente trocou)
    if front_image and old_front_path and new_front_path and old_front_path != new_front_path:
        await delete_file(old_front_path)

    if back_image and old_back_path and new_back_path and old_back_path != new_back_path:
        await delete_file(old_back_path)

    # opcional: resposta já com URL válida
    if front_signed_url:
        updated.image_url_front = front_signed_url
    if back_signed_url:
        updated.image_url_back = back_signed_url

    return updated

def delete_coin(db: Session, coin_id: int) -> Coin | None:
    return coin_repo.delete_coin(db, coin_id)
