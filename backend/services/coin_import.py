import csv
import io
from datetime import datetime

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
        pass
    try:
        return content.decode("cp1252")  # Excel pt-BR "CSV" default
    except UnicodeDecodeError:
        raise ImportFileError("Codificação não reconhecida (use UTF-8 ou Windows-1252).")


def parse_br_date(value: str):
    for fmt in ("%d/%m/%Y %H:%M", "%d/%m/%Y"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            pass
    return value  # ISO or invalid: left for pydantic


def parse_csv(text: str) -> list[dict]:
    header = text.split("\n", 1)[0]
    delimiter = ";" if header.count(";") > header.count(",") else ","
    return list(csv.DictReader(io.StringIO(text), delimiter=delimiter))


def normalize_row(row: dict) -> dict:
    """CSV cells: trim, empty -> dropped (model defaults apply), decimal comma, BR dates."""
    out = {}
    for key, value in row.items():
        key = (key or "").strip().lower()
        if isinstance(value, str):
            value = value.strip() or None
        if not key or value is None:
            continue
        if key in FLOAT_FIELDS | INT_FIELDS and isinstance(value, str):
            value = value.replace(",", ".")
        if key == "acquisition_date" and isinstance(value, str):
            value = parse_br_date(value)
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
            if normalize:
                row = normalize_row(row)
                if not row:  # blank spreadsheet row (e.g. trailing ";;;")
                    continue
            row = {k: v for k, v in row.items() if k not in IGNORED}
            coins.append(CoinCreate(**row))
        except (ValidationError, ValueError, TypeError) as exc:
            errors.append({"row": n, "message": row_message(exc)})
    return coins, errors
