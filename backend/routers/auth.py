from datetime import datetime, timedelta, timezone

import pyotp
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import (
    create_access_token,
    decrypt_data,
    encrypt_data,
    get_current_active_user,
    hash_password,
    verify_password,
)
from models.user import User
from schemas.auth import (
    MFALoginRequest,
    MFASetupResponse,
    MFAVerifyRequest,
    LoginResponse,
    Token,
    UserCreate,
    UserRead,
)

router = APIRouter(prefix="/auth", tags=["auth"])

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15


def _normalize_totp_code(code: str) -> str:
    return code.strip().replace(" ", "")


def _normalize_secret(secret: str | bytes | bytearray) -> str:
    if isinstance(secret, (bytes, bytearray)):
        secret = secret.decode("utf-8", errors="ignore")
    return str(secret).strip().replace(" ", "")


def _totp_from_encrypted_secret(encrypted_secret: str) -> pyotp.TOTP:
    decrypted = decrypt_data(encrypted_secret)
    decrypted = _normalize_secret(decrypted)
    return pyotp.TOTP(decrypted)


def _raise_if_locked(user: User) -> None:
    now_utc = datetime.now(timezone.utc)
    if user.lockout_until and user.lockout_until > now_utc:
        minutes_left = int((user.lockout_until - now_utc).total_seconds() / 60)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account locked. Try again after {minutes_left} minutes.",
        )


def _register_failed_attempt(db: Session, user: User) -> None:
    now_utc = datetime.now(timezone.utc)
    user.failed_login_attempts += 1
    if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
        user.lockout_until = now_utc + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
    db.commit()


def _reset_lockout(db: Session, user: User) -> None:
    user.failed_login_attempts = 0
    user.lockout_until = None
    db.commit()


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserRead)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    query = select(User).where(User.email == user_in.email)
    existing_user = db.execute(query).scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered.",
        )

    user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        display_name=user_in.display_name,
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=LoginResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    query = select(User).where(User.email == form_data.username)
    user = db.execute(query).scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    _raise_if_locked(user)

    if not verify_password(form_data.password, user.hashed_password):
        _register_failed_attempt(db, user)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    _reset_lockout(db, user)
    jwt_token = create_access_token(user_id=user.id)

    return LoginResponse(
        token=Token(access_token=jwt_token),
        mfa_required=bool(user.is_mfa_enabled),
    )



@router.post("/login/mfa", response_model=Token)
def login_mfa(
    mfa_login_data: MFALoginRequest,
    db: Session = Depends(get_db),
):
    query = select(User).where(User.email == mfa_login_data.email)
    user = db.execute(query).scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    _raise_if_locked(user)

    if not verify_password(mfa_login_data.password, user.hashed_password):
        _register_failed_attempt(db, user)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    if not user.is_mfa_enabled or not user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled for this account.",
        )

    totp = _totp_from_encrypted_secret(user.mfa_secret)
    code = _normalize_totp_code(mfa_login_data.totp_code)

    if not totp.verify(code, valid_window=1):
        _register_failed_attempt(db, user)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid TOTP code.",
        )

    _reset_lockout(db, user)

    access_token = create_access_token(user_id=user.id)
    return Token(access_token=access_token)


# --- MFA Endpoints ---

mfa_router = APIRouter(
    prefix="/mfa",
    tags=["mfa"],
    dependencies=[Depends(get_current_active_user)],
)


@mfa_router.post("/setup", response_model=MFASetupResponse)
def setup_mfa(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.is_mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is already enabled.",
        )

    if current_user.mfa_secret:
        decrypted = decrypt_data(current_user.mfa_secret)
        mfa_secret = _normalize_secret(decrypted)
    else:
        mfa_secret = pyotp.random_base32()
        current_user.mfa_secret = encrypt_data(mfa_secret)
        db.commit()

    totp = pyotp.TOTP(mfa_secret)
    provisioning_uri = totp.provisioning_uri(
        name=current_user.email,
        issuer_name="Numis",
    )
    return MFASetupResponse(provisioning_uri=provisioning_uri)


@mfa_router.post("/verify")
def verify_mfa(
    mfa_in: MFAVerifyRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.is_mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is already enabled.",
        )

    if not current_user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA secret not found. Please run setup first.",
        )

    totp = _totp_from_encrypted_secret(current_user.mfa_secret)
    code = _normalize_totp_code(mfa_in.totp_code)

    if not totp.verify(code, valid_window=1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid TOTP code.",
        )

    current_user.is_mfa_enabled = True
    db.commit()
    return {"detail": "MFA has been enabled successfully."}


@mfa_router.post("/disable")
def disable_mfa(
    mfa_in: MFAVerifyRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_mfa_enabled or not current_user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled.",
        )

    totp = _totp_from_encrypted_secret(current_user.mfa_secret)
    code = _normalize_totp_code(mfa_in.totp_code)

    if not totp.verify(code, valid_window=1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid TOTP code.",
        )

    current_user.is_mfa_enabled = False
    current_user.mfa_secret = None
    db.commit()
    return {"detail": "MFA has been disabled successfully."}


# --- User Endpoints ---

user_router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(get_current_active_user)],
)


@user_router.get("/me", response_model=UserRead)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


router.include_router(mfa_router)
router.include_router(user_router)
