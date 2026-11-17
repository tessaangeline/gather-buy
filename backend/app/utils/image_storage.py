
import uuid
from pathlib import Path
from io import BytesIO

from fastapi import UploadFile, HTTPException, status
from PIL import Image, UnidentifiedImageError


ALLOWED_CONTENT_TYPES = {
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WEBP"
}

MAX_FILE_SIZE = 5 * 1024 * 1024

UPLOAD_DIR = Path("uploads/products")


async def save_product_image(file: UploadFile, product_id: int) -> str:

    # 1. Check the declared content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG and WebP images are allowed"
        )

    # 2. Read the uploaded file
    contents = await file.read()

    # 3. Check file size
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

    # 4. Verify actual image content
    try:
        with Image.open(BytesIO(contents)) as image:
            image.verify()

            if image.format != ALLOWED_CONTENT_TYPES[file.content_type]:
                raise HTTPException(
                    status_code=400,
                    detail="File content does not match its declared image type"
                )

    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupted image file"
        )

    # 5. Generate filename using product ID
    original_filename = Path(file.filename).name

    filename = f"{product_id}_{original_filename}"

    # 6. Create directory
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    # 7. Save image
    file_path = UPLOAD_DIR / filename
    file_path.write_bytes(contents)

    # 8. Return relative path
    return f"/uploads/products/{filename}"
