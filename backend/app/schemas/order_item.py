from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)

class OrderProductResponse(BaseModel):
    id: int
    name: str
    image_url: str | None = None

    model_config = ConfigDict(from_attributes=True)

class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product: OrderProductResponse
    quantity: int
    retail_price: Decimal
    final_unit_price: Decimal | None = None

