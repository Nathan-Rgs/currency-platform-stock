import os
import uuid

from fastapi import HTTPException, UploadFile, status

ALLOWED_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_IMAGE_BYTES = 10 * 1024 * 1024
URL_PREFIX = "media/coins/"
_CHUNK = 1024 * 1024


def save_image(file: UploadFile, media_dir: str) -> str:
    """Valida tipo/tamanho, grava em media_dir e devolve o caminho de URL `media/coins/<nome>`."""
    ext = ALLOWED_IMAGE_TYPES.get(file.content_type)
    if ext is None:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            "Formato não suportado. Use JPG, PNG ou WEBP.",
        )
    os.makedirs(media_dir, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(media_dir, name)
    size = 0
    try:
        with open(path, "wb") as out:
            while chunk := file.file.read(_CHUNK):
                size += len(chunk)
                if size > MAX_IMAGE_BYTES:
                    raise HTTPException(
                        status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        "Imagem maior que 10 MB.",
                    )
                out.write(chunk)
    except BaseException:
        if os.path.exists(path):
            os.remove(path)
        raise
    return URL_PREFIX + name


def delete_media(url_path: str | None, media_dir: str) -> None:
    """Apaga o arquivo de uma URL `media/coins/...`; ignora vazio, inexistente ou fora do prefixo."""
    if not url_path or not url_path.startswith(URL_PREFIX):
        return
    try:
        os.remove(os.path.join(media_dir, os.path.basename(url_path)))
    except OSError:
        pass
