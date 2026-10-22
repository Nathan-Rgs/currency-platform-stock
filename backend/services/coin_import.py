import csv
import io

from pydantic import ValidationError

from schemas.coin import CoinCreate

FLOAT_FIELDS = {"purchase_price", "estimated_value", "sale_price", "diameter_mm", "weight_g"}
INT_FIELDS = {"year", "quantity"}
IGNORED = {"id", "owner_id", "created_at", "updated_at", "image_url_front", "image_url_back"}
TEMPLATE_COLUMNS = [f for f in CoinCreate.model_fields if not f.startswith("image_url_")]


class ImportFileError(ValueError):
    pass


def decode(content: bytes) -> str:
    try:
        return content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise ImportFileError("Arquivo não está em UTF-8 válido.")


def parse_csv(text: str) -> list[dict]:
    header = text.split("\n", 1)[0]
    delimiter = ";" if header.count(";") > header.count(",") else ","
    return list(csv.DictReader(io.StringIO(text), delimiter=delimiter))


def normalize_row(row: dict) -> dict:
    out = {}
    for key, value in row.items():
        key = (key or "").strip()
        if not key or key in IGNORED:
            continue
        if isinstance(value, str):
            value = value.strip() or None
        if value is not None and key in FLOAT_FIELDS | INT_FIELDS and isinstance(value, str):
            value = value.replace(",", ".")
        out[key] = value
    return out


def row_message(exc: Exception) -> str:
    if isinstance(exc, ValidationError):
        return "; ".join(
            f"{'.'.join(map(str, e['loc'])) or 'linha'}: {e['msg']}" for e in exc.errors()
        )
    return str(exc)


def build_coins(rows: list[dict], normalize: bool) -> tuple[list[CoinCreate], list[dict]]:
    coins, errors = [], []
    for n, row in enumerate(rows, start=1):
        try:
            if not isinstance(row, dict):
                raise ValueError("Linha inválida.")
            coins.append(CoinCreate(**(normalize_row(row) if normalize else row)))
        except (ValidationError, ValueError, TypeError) as exc:
            errors.append({"row": n, "message": row_message(exc)})
    return coins, errors
