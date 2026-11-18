from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.models.order import Order

from app.repositories.order import (
    get_resident_orders,
    get_order_by_id
)

def list_my_orders(
    db: Session,
    current_user: User
) -> list[Order]:

    if current_user.role != UserRole.RESIDENT:
        raise PermissionError(
            "Only residents can view their own orders"
        )

    return get_resident_orders(
        db,
        current_user.id
    )

def get_order_details(
    db: Session,
    current_user: User,
    order_id: int
) -> Order:

    if current_user.role != UserRole.RESIDENT:
        raise PermissionError(
            "Only residents can view order details"
        )

    order = get_order_by_id(db, order_id)

    if order is None:
        raise LookupError("Order not found")

    if order.resident_id != current_user.id:
        raise PermissionError(
            "You are not allowed to view this order"
        )

    return order

