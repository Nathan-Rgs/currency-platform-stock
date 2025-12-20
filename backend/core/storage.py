# core/storage.py

import os
import uuid
from typing import Optional, Tuple

from fastapi import UploadFile, HTTPException
from supabase import Client, create_client

from core.config import settings

DEFAULT_BUCKET = getattr(settings, "BUCKET_NAME", None)
DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 60

def _get_supabase_client() -> Client:
    url: Optional[str] = getattr(settings, "SUPABASE_URL", None)
    key: Optional[str] = getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", None)

    if not url or not key:
        raise RuntimeError("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos no .env")

    url = url.strip()
    key = key.strip()

    if key.startswith("sb_secret_"):
        raise RuntimeError(
            "SUPABASE_SERVICE_ROLE_KEY parece ser um 'sb_secret_*' (segredo errado). "
            "Use a chave 'service_role (secret)' em Project Settings > API > Project API keys "
            "(normalmente começa com 'eyJ...')."
        )

    if getattr(settings, "DEBUG", False):
        print(
            f"[storage] Supabase URL={url!r} bucket={getattr(settings, 'BUCKET_NAME', DEFAULT_BUCKET)!r} "
            f"key_len={len(key)} key_head={key[:10]!r}"
        )

    return create_client(url, key)


supabase: Client = _get_supabase_client()


def _unique_filename(original_name: str) -> str:
    _, ext = os.path.splitext(original_name or "")
    ext = (ext or "").lower()
    return f"{uuid.uuid4().hex}{ext}"


def _bucket_name() -> str:
    return (getattr(settings, "BUCKET_NAME", DEFAULT_BUCKET) or DEFAULT_BUCKET).strip()


def create_signed_url(file_path: str, expires_in: int = DEFAULT_SIGNED_URL_TTL_SECONDS) -> str:
    """
    Gera uma signed URL para um arquivo em bucket privado.
    """
    bucket = _bucket_name()
    if not file_path:
        raise HTTPException(status_code=400, detail="file_path inválido.")

    try:
        res = supabase.storage.from_(bucket).create_signed_url(file_path, expires_in)

        # supabase-py pode devolver dict ou objeto semelhante a dict
        if isinstance(res, dict):
            # algumas versões usam 'signedURL', outras 'signedUrl'
            url = res.get("signedURL") or res.get("signedUrl")
            if not url:
                # às vezes vem dentro de 'data'
                data = res.get("data") or {}
                url = data.get("signedURL") or data.get("signedUrl")
            if url:
                return url

        if hasattr(res, "get"):
            url = res.get("signedURL") or res.get("signedUrl")
            if url:
                return url

        # fallback
        raise HTTPException(status_code=500, detail=f"Resposta inesperada ao gerar signed URL: {res}")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar signed URL: {e}")


async def save_file(
    file: UploadFile,
    *,
    expires_in: int = DEFAULT_SIGNED_URL_TTL_SECONDS,
    folder: str = "",
    return_path: bool = True,
) -> Tuple[str, str] | str:
    """
    Upload em bucket privado.

    Retorna por padrão: (signed_url, path)  -> recomendado para você salvar o path no banco
    Se return_path=False: retorna apenas signed_url
    """
    bucket = _bucket_name()

    if not file:
        raise HTTPException(status_code=400, detail="Arquivo não enviado.")

    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Falha ao ler arquivo: {e}")

    if not content:
        raise HTTPException(status_code=400, detail="Arquivo vazio.")

    filename = _unique_filename(file.filename)

    # opcional: organizar em “pastas”
    if folder:
        folder = folder.strip().strip("/")
        path = f"{folder}/{filename}"
    else:
        path = filename

    try:
        supabase.storage.from_(bucket).upload(
            path=path,
            file=content,
            file_options={"content-type": file.content_type or "application/octet-stream"},
        )

        signed_url = create_signed_url(path, expires_in=expires_in)

        if return_path:
            return signed_url, path
        return signed_url

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao enviar para o Supabase: {e}")


async def delete_file(file_path: str) -> bool:
    """
    Deleta arquivo pelo path/key (ex.: 'coins/abc.jpg' ou 'abc.jpg').
    """
    bucket = _bucket_name()
    if not file_path:
        return False

    try:
        supabase.storage.from_(bucket).remove([file_path])
        return True
    except Exception:
        return False
