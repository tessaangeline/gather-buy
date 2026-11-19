
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Query,
    UploadFile,
    File,
    Form
)

from decimal import Decimal
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductStatusUpdate,
    StockAdjustment
)
from app.api.dependencies import require_roles

from app.repositories.product import get_product_by_id
from app.utils.image_storage import save_product_image, UPLOAD_DIR

from app.services.product import (
    register_product,
    list_products,
    edit_product,
    update_product_status,
    adjust_stock,
)


router = APIRouter(prefix="/products", tags=["Products"])


# Create a product

@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_product_api(
    name: str = Form(..., min_length=1, max_length=150),
    description: str | None = Form(default=None),
    unit: str = Form(..., min_length=1, max_length=50),
    retail_price: Decimal = Form(..., ge=0),
    stock_on_hand: int = Form(default=0, ge=0),
    file: UploadFile | None = File(default=None),
    current_user: User = Depends(require_roles(UserRole.SUPPLIER)),
    db: Session = Depends(get_db)
):
    try:
        product_data = ProductCreate(
            name=name,
            description=description,
            unit=unit,
            retail_price=retail_price,
            stock_on_hand=stock_on_hand
        )

        product = register_product(
            db=db,
            current_user=current_user,
            product_data=product_data
        )

        if file:
            image_url = await save_product_image(file, product.id)
            product = edit_product(
                db=db,
                current_user=current_user,
                product_id=product.id,
                product_data=ProductUpdate(image_url=image_url)
            )

        return product

    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# Get products

@router.get(
    "/",
    response_model=list[ProductResponse]
)
def get_products_api(
    search: str | None = Query(default=None),
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
async def update_product_api(
    product_id: int,
    name: str | None = Form(default=None),
    description: str | None = Form(default=None),
    unit: str | None = Form(default=None),
    retail_price: Decimal | None = Form(default=None),
    file: UploadFile | None = File(default=None),
    current_user: User = Depends(require_roles(UserRole.SUPPLIER)),
    db: Session = Depends(get_db)
):
    product = get_product_by_id(db, product_id)

    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    old_image_url = product.image_url
    new_image_url = None

    try:
        update_data = {}

        if name is not None:
            update_data["name"] = name

        if description is not None:
            update_data["description"] = description

        if unit is not None:
            update_data["unit"] = unit

        if retail_price is not None:
            update_data["retail_price"] = retail_price

        if file is not None:
            new_image_url = await save_product_image(file, product_id)
            update_data["image_url"] = new_image_url

        if not update_data:
            raise ValueError("Provide at least one field to update")

        product_data = ProductUpdate(**update_data)

        updated_product = edit_product(
            db=db,
            current_user=current_user,
            product_id=product_id,
            product_data=product_data
        )

        # Delete old image only after successful database update
        if new_image_url and old_image_url:
            old_file = UPLOAD_DIR / Path(old_image_url).name

            if old_file.exists():
                try:
                    old_file.unlink()
                except OSError:
                    pass

        return updated_product

    except Exception:
        db.rollback()

        # Remove newly uploaded image if the update fails
        if new_image_url:
            new_file = UPLOAD_DIR / Path(new_image_url).name

            if new_file.exists():
                new_file.unlink()

        raise


@router.patch(
    "/{product_id}/status",
    response_model=ProductResponse
)
def update_product_status_api(
    product_id: int,
    status_data: ProductStatusUpdate,
    current_user: User = Depends(require_roles(UserRole.SUPPLIER)),
    db: Session = Depends(get_db)
):
    try:
        return update_product_status(
            db=db,
            current_user=current_user,
            product_id=product_id,
            is_active=status_data.is_active
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

