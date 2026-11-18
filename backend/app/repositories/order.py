
from sqlalchemy.orm import Session, joinedload

from app.models.order import Order
from app.models.order_item import OrderItem


def create_order(db: Session, order: Order) -> Order:
    db.add(order)
    db.flush()
    return order


def create_order_items(
    db: Session,
    order_items: list[OrderItem]
) -> list[OrderItem]:

    db.add_all(order_items)
    db.flush()

    return order_items


def get_order_by_id(
    db: Session,
    order_id: int
) -> Order | None:

    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )


def get_resident_orders(
    db: Session,
    resident_id: int
) -> list[Order]:

    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.resident_id == resident_id)
        .order_by(Order.order_date.desc())
        .all()
    )


def get_community_orders(
    db: Session,
    community_id: int
) -> list[Order]:

    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.community_id == community_id)
        .order_by(Order.order_date.desc())
        .all()
    )
