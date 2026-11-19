
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.repositories.product import (
    create_product as create_product_record,
    get_all_products,
    get_available_products, 
    get_product_by_id,
    update_product as update_product_record,
    deactivate_product as deactivate_product_record,
    activate_product as activate_product_record,
    adjust_product_stock as adjust_product_stock_record,
    filter_products
)

def register_product(
    db: Session,
    current_user: User,
    product_data: ProductCreate
) -> Product:

    if current_user.role != UserRole.SUPPLIER:
        raise PermissionError(
            "Only Supplier can create products"
        )

    data = product_data.model_dump()

    data["name"] = data["name"].strip()
    data["unit"] = data["unit"].strip()

    if not data["name"]:
        raise ValueError("Product name cannot be empty")

    if not data["unit"]:
        raise ValueError("Product unit cannot be empty")

    return create_product_record(db, data)

def list_products(
    db: Session,
    current_user: User,
    search: str | None = None,
    availability: str | None = None,
    skip: int = 0,
    limit: int = 10

):
    valid_filters = (
        "available",
        "out_of_stock",
        "active",
        "inactive"
    )

    if availability and availability not in valid_filters:
        raise ValueError("Invalid availability filter")

    if current_user.role == UserRole.SUPPLIER:
        return filter_products(
            db=db,
            availability=availability,
            search=search,
            skip=skip,
            limit=limit
        )

    elif current_user.role == UserRole.RESIDENT:

        if availability not in (None, "available"):
            raise PermissionError(
                "Residents can only view available products"
            )

        return filter_products(
            db=db,
            search=search,
            available_only=True,
            skip=skip,
            limit=limit
        )

    else:
        raise PermissionError(
            "You are not allowed to view products"
        )
    
def edit_product(
    db: Session,
    current_user: User,
    product_id: int,
    product_data: ProductUpdate
) -> Product:

    if current_user.role != UserRole.SUPPLIER:
        raise PermissionError(
            "Only Supplier can update products"
        )

    product = get_product_by_id(db, product_id)

    if product is None:
        raise LookupError("Product not found")

    update_data = product_data.model_dump(exclude_unset=True)

    if "retail_price" in update_data and update_data["retail_price"] is None:
        raise ValueError("Product price cannot be empty")


    if not update_data:
        raise ValueError("No fields provided for update")

    if "name" in update_data:
        if update_data["name"] is None:
            raise ValueError("Product name cannot be empty")
        update_data["name"] = update_data["name"].strip()

    if "unit" in update_data:
        if update_data["unit"] is None:
            raise ValueError("Product unit cannot be empty")
        update_data["unit"] = update_data["unit"].strip()

    if "name" in update_data and not update_data["name"]:
        raise ValueError("Product name cannot be empty")

    if "unit" in update_data and not update_data["unit"]:
        raise ValueError("Product unit cannot be empty")

    return update_product_record(db, product, update_data)


def update_product_status(
    db: Session,
    current_user: User,
    product_id: int,
    is_active: bool
) -> Product:

    if current_user.role != UserRole.SUPPLIER:
        raise PermissionError("Only suppliers can update product status")

    product = get_product_by_id(db, product_id)

    if product is None:
        raise LookupError("Product not found")

    if product.is_active == is_active:
        raise ValueError(
            "Product is already active" if is_active
            else "Product is already inactive"
        )

    product.is_active = is_active
    db.commit()
    db.refresh(product)

    return product


def adjust_stock(
    db: Session,
    current_user: User,
    product_id: int,
    quantity: int,
    operation: str
):
    # Only suppliers can adjust stock
    if current_user.role != UserRole.SUPPLIER:
        raise PermissionError("Only suppliers can adjust stock")

    # Check whether the product exists
    product = get_product_by_id(db, product_id)

    if not product:
        raise LookupError("Product not found")

    # Calculate the stock change
    if operation == "ADD":
        quantity_delta = quantity
    elif operation == "REMOVE":
        quantity_delta = -quantity
    else:
        raise ValueError("Invalid stock operation")


    updated_product = adjust_product_stock_record(
        db,
        product,
        quantity_delta
)

    if updated_product is None:
    # Check whether the product still exists
        product = get_product_by_id(db, product_id)

        if product is None:
            raise LookupError("Product not found")

        raise ValueError("Cannot reduce stock below reserved quantity")

    return updated_product
