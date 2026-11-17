from decimal import Decimal

from sqlalchemy import String, Integer, Boolean, Numeric, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    unit: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    retail_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    stock_on_hand: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    stock_reserved: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    __table_args__ = (
        CheckConstraint("retail_price >= 0", name="check_product_price_non_negative"),
        CheckConstraint("stock_on_hand >= 0", name="check_product_stock_non_negative"),
        CheckConstraint("stock_reserved >= 0", name="check_product_reserved_non_negative"),
        CheckConstraint("stock_reserved <= stock_on_hand", name="check_product_reserved_not_above_stock"),
    )