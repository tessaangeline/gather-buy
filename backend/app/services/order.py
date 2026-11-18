from sqlalchemy.orm import Session
from sqlalchemy import update

from datetime import date 
from decimal import Decimal

from app.repositories.order import get_community_bulk_orders, create_order, create_order_items
from app.schemas.bulk_order import BulkOrderResponse, BulkOrderProductResponse
from app.models.user import User, UserRole
from app.models.order import Order
from app.models.order_item import OrderItem
from app.utils.order_utils import is_order_window_open
from app.repositories.product import get_products_by_ids, reserve_product_stock
from app.schemas.order_item import OrderItemCreate
from app.models.product import Product

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

def validate_resident_for_order(current_user: User) -> int:
    if current_user.role != UserRole.RESIDENT:
        raise PermissionError("Only residents can place orders")

    if current_user.community_id is None:
        raise ValueError("Resident is not assigned to a community")

    return current_user.community_id

def validate_order_products(
    db: Session,
    items: list[OrderItemCreate]
):
    product_ids = list(set(item.product_id for item in items))

    products = get_products_by_ids(db, product_ids)

    product_map = {product.id: product for product in products}

    # Check whether all requested products exist
    for product_id in product_ids:
        if product_id not in product_map:
            raise LookupError(f"Product {product_id} not found")

    # Combine quantities if the same product appears multiple times
    requested_quantities = {}

    for item in items:
        requested_quantities[item.product_id] = (
            requested_quantities.get(item.product_id, 0) + item.quantity
        )

    # Validate each product
    for product_id, quantity in requested_quantities.items():
        product = product_map[product_id]

        if not product.is_active:
            raise ValueError(f"{product.name} is currently unavailable")

        available_stock = product.stock_on_hand - product.stock_reserved

        if quantity > available_stock:
            raise ValueError(
                f"Insufficient stock for {product.name}. "
                f"Available: {available_stock}"
            )

    return products

def calculate_order_total(
    items: list[OrderItemCreate],
    products: list[Product]
) -> Decimal:
    product_map = {product.id: product for product in products}

    total = Decimal("0.00")

    for item in items:
        product = product_map[item.product_id]
        total += product.retail_price * item.quantity

    return total

def prepare_order_items(
    items: list[OrderItemCreate],
    products: list[Product]
) -> list[OrderItem]:

    product_map = {product.id: product for product in products}

    order_items = []

    for item in items:
        product = product_map[item.product_id]

        order_item = OrderItem(
            product_id=product.id,
            quantity=item.quantity,
            retail_price=product.retail_price,
            final_unit_price=None
        )

        order_items.append(order_item)

    return order_items


def place_order(
    db: Session,
    current_user: User,
    items: list[OrderItemCreate]
) -> Order:

    try:
        # 1. Check order cutoff
        if not is_order_window_open():
            raise ValueError("Order placement is closed for today")

        # 2. Validate resident and get their community
        community_id = validate_resident_for_order(current_user)

        # 3. Validate requested products and quantities
        products = validate_order_products(db, items)

        # 4. Calculate total using database prices
        total_amount = calculate_order_total(items, products)

        # 5. Combine duplicate product quantities
        requested_quantities = {}

        for item in items:
            requested_quantities[item.product_id] = (
                requested_quantities.get(item.product_id, 0) + item.quantity
            )

        # 6. Atomically reserve stock
        for product_id, quantity in requested_quantities.items():
            reserved = reserve_product_stock(
                db,
                product_id,
                quantity
            )

            if not reserved:
                raise ValueError(
                    f"Insufficient stock for product {product_id}"
                )

        # 7. Create the order
        order = Order(
            resident_id=current_user.id,
            community_id=community_id,
            total_amount=total_amount
        )

        create_order(db, order)

        # 8. Prepare and save order items
        order_items = prepare_order_items(items, products)

        for order_item in order_items:
            order_item.order_id = order.id

        create_order_items(db, order_items)

        # 9. Commit everything together
        db.commit()

        return get_order_by_id(db, order.id)

    except Exception:
        db.rollback()
        raise