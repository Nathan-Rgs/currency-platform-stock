import pytest
from pydantic import ValidationError

from core.config import Settings


@pytest.mark.parametrize("key", ["", "curta", "troca_essa_chave", "x" * 31])
def test_insecure_jwt_key_rejected(key):
    with pytest.raises(ValidationError, match="JWT_SECRET_KEY inseguro"):
        Settings(DATABASE_URL="sqlite://", JWT_SECRET_KEY=key, MFA_SECRET_KEY="m")


def test_secure_jwt_key_accepted():
    Settings(DATABASE_URL="sqlite://", JWT_SECRET_KEY="x" * 32, MFA_SECRET_KEY="m")
