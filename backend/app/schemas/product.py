
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    image_url: str | None = None
    unit: str = Field(min_length=1, max_length=50)
    retail_price: Decimal = Field(
        ge=0,
        max_digits=10,
        decimal_places=2
    )
    stock_on_hand: int = Field(default=0, ge=0)


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None
    image_url: str | None = None
    unit: str | None = Field(default=None, min_length=1, max_length=50)
    retail_price: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=10,
        decimal_places=2
    )

class ProductStatusUpdate(BaseModel):
    is_active: bool

class StockAdjustment(BaseModel):
    quantity: int = Field(gt=0)
    operation: str = Field(pattern="^(ADD|REMOVE)$")

class ProductResponse(BaseModel):
    id: int
    name: str
    description: str | None
    image_url: str | None
    unit: str
    retail_price: Decimal
    stock_on_hand: int
    stock_reserved: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
