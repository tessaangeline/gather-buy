from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from datetime import date

from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.order import OrderResponse, OrderCreate, OrderUpdate
from app.api.dependencies import get_current_user, require_roles
from app.schemas.bulk_order import BulkOrderResponse
from app.services.order import (
    list_my_orders,
    get_order_details,
    place_order,
    get_supplier_bulk_orders,
    edit_order
)

from app.services.order import (
    list_my_orders,
    get_order_details
)

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


@router.get("/bulk", response_model=BulkOrderResponse)
def get_bulk_orders(
    community_id: int,
    order_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return get_supplier_bulk_orders(
            db,
            current_user,
            community_id,
            order_date
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.post(
    "/",
    response_model=OrderResponse,
    status_code=201
)
def place_order_api(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.RESIDENT)
    )
):
    try:
        return place_order(
            db=db,
            current_user=current_user,
            items=order_data.items
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=403,
            detail=str(exc)
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc)
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

@router.get(
    "/",
    response_model=list[OrderResponse]
)
def get_my_orders_api(
    current_user: User = Depends(
        require_roles(UserRole.RESIDENT)
    ),
    db: Session = Depends(get_db)
):
    try:
        return list_my_orders(
            db=db,
            current_user=current_user
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=403,
            detail=str(exc)
        )

@router.get(
    "/{order_id}",
    response_model=OrderResponse
)
def get_order_details_api(
    order_id: int,
    current_user: User = Depends(
        require_roles(UserRole.RESIDENT)
    ),
    db: Session = Depends(get_db)
):
    try:
        return get_order_details(
            db=db,
            current_user=current_user,
            order_id=order_id
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc)
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=403,
            detail=str(exc)
        )

@router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    order_data: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        updated_order = edit_order(
            db,
            current_user,
            order_id,
            order_data.items
        )
        return updated_order

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to update order"
        )