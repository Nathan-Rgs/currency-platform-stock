from sqlalchemy.orm import Session
from models.coin import Coin

def get_all_coins(db: Session, skip: int = 0, limit: int = 100) -> list[Coin]:
    skip = max(skip, 0)
    limit = min(max(limit, 1), 500)
    return db.query(Coin).offset(skip).limit(limit).all()

def create_coin(db: Session, coin: Coin) -> Coin:
    db.add(coin)
    db.commit()
    db.refresh(coin)
    return coin

def get_coin_by_id(db: Session, coin_id: int) -> Coin | None:
    return db.query(Coin).filter(Coin.id == coin_id).first()

def update_coin(db: Session, coin: Coin) -> Coin:
    coin = db.merge(coin)
    db.commit()
    db.refresh(coin)
    return coin

def delete_coin(db: Session, coin_id: int) -> Coin | None:
    coin = get_coin_by_id(db, coin_id)
    if not coin:
        return None
    db.delete(coin)
    db.commit()
    return coin
