from sqlalchemy.orm import Session
from sqlalchemy import update

from app.models.product import Product


def create_product(db: Session, product_data: dict) -> Product:
    product = Product(**product_data)

    db.add(product)
    db.commit()
    db.refresh(product)

    return product

def get_product_by_id(
    db: Session,
    product_id: int
) -> Product | None:

    return (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

def get_products_by_ids(
    db: Session,
    product_ids: list[int]
) -> list[Product]:
    return (
        db.query(Product)
        .filter(Product.id.in_(product_ids))
        .all()
    )

def get_all_products(db: Session) -> list[Product]:
    return db.query(Product).all()

def get_active_products(db: Session) -> list[Product]:
    return (
        db.query(Product)
        .filter(Product.is_active.is_(True))
        .all()
    )

def get_available_products(db: Session) -> list[Product]:
    return (
        db.query(Product)
        .filter(
            Product.is_active.is_(True),
            Product.stock_on_hand > Product.stock_reserved
        )
        .all()
    )

def update_product(
    db: Session,
    product: Product,
    update_data: dict
) -> Product:

    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)

    return product

def deactivate_product(db: Session, product: Product) -> Product:
    product.is_active = False

    db.commit()
    db.refresh(product)

    return product

def activate_product(db: Session, product: Product) -> Product:
    product.is_active = True

    db.commit()
    db.refresh(product)

    return product

def adjust_product_stock(
    db: Session,
    product: Product,
    quantity_delta: int
) -> Product | None:

    result = db.execute(
        update(Product)
        .where(
            Product.id == product.id,
            Product.stock_on_hand + quantity_delta >= Product.stock_reserved
        )
        .values(
            stock_on_hand=Product.stock_on_hand + quantity_delta
        )
    )

    if result.rowcount == 0:
        db.rollback()
        return None

    db.commit()
    db.refresh(product)

    return product

def search_products_by_name(
    db: Session,
    search_term: str,
    available_only: bool = False
) -> list[Product]:

    query = db.query(Product).filter(
        Product.name.ilike(f"%{search_term}%")
    )

    if available_only:
        query = query.filter(
            Product.is_active.is_(True),
            Product.stock_on_hand > Product.stock_reserved
        )

    return query.all()

def filter_products(
    db: Session,
    availability: str | None = None,
    search: str | None = None,
    available_only: bool = False,
    skip: int = 0,
    limit: int = 10
) -> list[Product]:

    query = db.query(Product)

    if search:
        query = query.filter(
            Product.name.ilike(f"%{search}%")
        )

    if available_only:
        query = query.filter(
            Product.is_active.is_(True),
            Product.stock_on_hand > Product.stock_reserved
        )

    elif availability == "available":
        query = query.filter(
            Product.is_active.is_(True),
            Product.stock_on_hand > Product.stock_reserved
        )

    elif availability == "out_of_stock":
        query = query.filter(
            Product.is_active.is_(True),
            Product.stock_on_hand <= Product.stock_reserved
        )

    elif availability == "active":
        query = query.filter(Product.is_active.is_(True))

    elif availability == "inactive":
        query = query.filter(Product.is_active.is_(False))

    query = query.order_by(Product.id)

    return query.offset(skip).limit(limit).all()

def reserve_product_stock(
    db: Session,
    product_id: int,
    quantity: int
) -> bool:
    result = db.execute(
        update(Product)
        .where(
            Product.id == product_id,
            Product.stock_on_hand - Product.stock_reserved >= quantity
        )
        .values(
            stock_reserved=Product.stock_reserved + quantity
        )
    )

    return result.rowcount > 0

def release_product_stock(db: Session, product_id: int, quantity: int) -> bool:
    result = db.execute(
        update(Product)
        .where(
            Product.id == product_id,
            Product.stock_reserved >= quantity
        )
        .values(
            stock_reserved=Product.stock_reserved - quantity
        )
        .execution_options(synchronize_session=False)
    )

    return result.rowcount == 1
