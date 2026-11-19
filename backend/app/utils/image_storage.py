
import uuid
from pathlib import Path
from io import BytesIO

from fastapi import UploadFile, HTTPException
from PIL import Image, UnidentifiedImageError


ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ("JPEG", ".jpg"),
    "image/png": ("PNG", ".png"),
    "image/webp": ("WEBP", ".webp")
}

MAX_FILE_SIZE = 5 * 1024 * 1024

UPLOAD_DIR = Path("uploads/products")


async def save_product_image(file: UploadFile, product_id: int) -> str:

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG and WebP images are allowed"
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image cannot be empty"
        )

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Image size cannot exceed 5 MB"
        )

    try:
        with Image.open(BytesIO(contents)) as image:
            image.verify()

            expected_format = ALLOWED_CONTENT_TYPES[file.content_type][0]

            if image.format != expected_format:
                raise HTTPException(
                    status_code=400,
                    detail="File content does not match its declared image type"
                )

    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupted image file"
        )

    extension = ALLOWED_CONTENT_TYPES[file.content_type][1]
    filename = f"{product_id}_{uuid.uuid4().hex}{extension}"

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    file_path = UPLOAD_DIR / filename
    file_path.write_bytes(contents)

    return f"/uploads/products/{filename}"
