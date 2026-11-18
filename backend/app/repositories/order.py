
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from datetime import date, datetime, time, timedelta

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product


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

def get_community_bulk_orders(
    db: Session,
    community_id: int,
    order_date: date
):
    start_datetime = datetime.combine(order_date, time.min)
    end_datetime = start_datetime + timedelta(days=1)

    return (
        db.query(
            Product.id,
            Product.name,
            Product.unit,
            Product.retail_price,
            func.sum(OrderItem.quantity).label("total_quantity"),
            func.count(func.distinct(Order.resident_id)).label("resident_count")
        )
        .join(Order, Order.id == OrderItem.order_id) #to get the community and order date.
        .join(Product, Product.id == OrderItem.product_id) #to get the product name, unit and retail price.
        .filter(
            Order.community_id == community_id,
            Order.order_date >= start_datetime,
            Order.order_date < end_datetime
        )
        .group_by(
            Product.id,
            Product.name,
            Product.unit,
            Product.retail_price
        )
        .all()
    )

def delete_order_items(
    db: Session,
    order_id: int
) -> None:

    db.query(OrderItem).filter(
        OrderItem.order_id == order_id
    ).delete(synchronize_session=False)