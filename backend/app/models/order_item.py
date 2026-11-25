
from decimal import Decimal

from sqlalchemy import Integer, Numeric, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.product import Product

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.order import Order

class OrderItem(Base):
    __tablename__ = "order_items"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="check_order_item_quantity_positive"),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    order_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("orders.id"),
        nullable=False
    )

    product_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    product: Mapped["Product"] = relationship()

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    retail_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    final_unit_price: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True
    )

    order: Mapped["Order"] = relationship(back_populates="items")
