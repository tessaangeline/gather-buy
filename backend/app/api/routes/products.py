
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Query,
    UploadFile,
    File
)
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    StockAdjustment
)
from app.api.dependencies import require_roles

from app.repositories.product import get_product_by_id
from app.utils.image_storage import save_product_image, UPLOAD_DIR

from app.services.product import (
    register_product,
    list_products,
    edit_product,
    remove_product,
    restore_product,
    adjust_stock
)


router = APIRouter(prefix="/products", tags=["Products"])


# Create a product
@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED
)
def create_product_api(
    product_data: ProductCreate,
    current_user: User = Depends(require_roles(UserRole.SUPPLIER)),
    db: Session = Depends(get_db)
):
    try:
        return register_product(
            db=db,
            current_user=current_user,
            product_data=product_data
        )

    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# List products
@router.get(
    "/",
    response_model=list[ProductResponse]
)
def get_products_api(
    search: str | None = Query(default=None, min_length=1),
    availability: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(
        require_roles(UserRole.SUPPLIER, UserRole.RESIDENT)
    ),
    db: Session = Depends(get_db)
):
    try:
        return list_products(
            db=db,
            current_user=current_user,
            search=search,
            availability=availability,
            skip=skip,
            limit=limit
        )

    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# Update a product
@router.put(
    "/{product_id}",
    response_model=ProductResponse
)
def update_product_api(
    product_id: int,
    product_data: ProductUpdate,
    current_user: User = Depends(require_roles(UserRole.SUPPLIER)),
    db: Session = Depends(get_db)
):
    try:
        return edit_product(
            db=db,
            current_user=current_user,
            product_id=product_id,
            product_data=product_data
        )

    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# Deactivate a product
@router.patch(
    "/{product_id}/status",
    response_model=ProductResponse
)
def deactivate_product_api(
    product_id: int,
    current_user: User = Depends(require_roles(UserRole.SUPPLIER)),
    db: Session = Depends(get_db)
):
    try:
        return remove_product(
            db=db,
            current_user=current_user,
            product_id=product_id
        )

    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# Activate a product
@router.patch(
    "/{product_id}/activate",
    response_model=ProductResponse
)
def activate_product_api(
    product_id: int,
    current_user: User = Depends(require_roles(UserRole.SUPPLIER)),
    db: Session = Depends(get_db)
):
    try:
        return restore_product(
            db=db,
            current_user=current_user,
            product_id=product_id
        )

    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# Adjust product stock
@router.patch(
    "/{product_id}/stock",
    response_model=ProductResponse
)
def adjust_product_stock_api(
    product_id: int,
    stock_data: StockAdjustment,
    current_user: User = Depends(
        require_roles(UserRole.SUPPLIER)
    ),
    db: Session = Depends(get_db)
):
    try:
        return adjust_stock(
            db=db,
            current_user=current_user,
            product_id=product_id,
            quantity=stock_data.quantity,
            operation=stock_data.operation
        )

    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# Upload or replace a product image
@router.post(
    "/{product_id}/image",
    response_model=ProductResponse
)
async def upload_product_image_api(
    product_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(
        require_roles(UserRole.SUPPLIER)
    ),
    db: Session = Depends(get_db)
):
    # 1. Check whether the product exists
    product = get_product_by_id(db, product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # 2. Remember the existing image
    old_image_url = product.image_url

    # 3. Validate and save the new image
    image_url = await save_product_image(file, product_id)

    # 4. Update the image URL in the database
    try:
        updated_product = edit_product(
            db=db,
            current_user=current_user,
            product_id=product_id,
            product_data=ProductUpdate(image_url=image_url)
        )

    except Exception:
        db.rollback()

        # Remove the new file if the database update fails
        if image_url != old_image_url:
            new_file = UPLOAD_DIR / Path(image_url).name

            if new_file.exists():
                new_file.unlink()

        raise

    # 5. Delete the previous image after successful update
    if old_image_url and old_image_url != image_url:
        old_file = UPLOAD_DIR / Path(old_image_url).name

        if old_file.exists():
            try:
                old_file.unlink()
            except OSError:
                # Keep the updated product even if old-file cleanup fails
                pass

    return updated_product
