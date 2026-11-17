
from fastapi import APIRouter, Depends, HTTPException, status, Query
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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc)
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )

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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc)
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )

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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc)
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc)
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )


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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc)
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc)
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )

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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc)
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc)
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )