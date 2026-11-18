from sqlalchemy.orm import Session

from datetime import date 

from app.repositories.order import get_community_bulk_orders
from app.schemas.bulk_order import BulkOrderResponse, BulkOrderProductResponse
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

def get_supplier_bulk_orders(
    db: Session,
    current_user: User,
    community_id: int,
    order_date: date
) -> BulkOrderResponse:

    if current_user.role != UserRole.SUPPLIER:
        raise PermissionError("Only suppliers can view bulk orders")

    bulk_orders = get_community_bulk_orders(
        db,
        community_id,
        order_date
    )

    products = [
        BulkOrderProductResponse(
            product_id=product_id,
            product_name=product_name,
            unit=unit,
            retail_price=retail_price,
            total_quantity=total_quantity,
            resident_count=resident_count
        )
        for product_id, product_name, unit, retail_price, total_quantity, resident_count in bulk_orders
    ]

    return BulkOrderResponse(
        community_id=community_id,
        order_date=order_date,
        products=products
    )
