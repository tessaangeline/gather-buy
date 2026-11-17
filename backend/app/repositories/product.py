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