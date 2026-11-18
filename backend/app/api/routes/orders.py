from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from datetime import date

from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.order import OrderResponse
from app.api.dependencies import get_current_user, require_roles
from app.schemas.bulk_order import BulkOrderResponse
from app.services.order import get_supplier_bulk_orders

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
