from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.order import OrderResponse
from app.api.dependencies import require_roles

from app.services.order import (
    list_my_orders,
    get_order_details
)

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
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

