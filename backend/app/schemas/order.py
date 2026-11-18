from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.order_item import OrderItemCreate, OrderItemResponse
from app.models.order import OrderStatus


class OrderCreate(BaseModel):
    items: list[OrderItemCreate] = Field(min_length=1)

class OrderUpdate(BaseModel):
    items: list[OrderItemCreate] = Field(min_length=1)

class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    resident_id: int
    community_id: int
    order_date: datetime
    status: OrderStatus
    total_amount: Decimal
    final_amount: Decimal | None = None
    cashback_amount: Decimal
    items: list[OrderItemResponse]


class OrderStatusUpdate(BaseModel):
    status: OrderStatus