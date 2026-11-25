from datetime import date
from decimal import Decimal

from pydantic import BaseModel

#Represents one aggregated product 
class BulkOrderProductResponse(BaseModel):
    product_id: int
    product_name: str
    unit: str
    retail_price: Decimal
    total_quantity: int
    resident_count: int

#Represents the complete bulk order for a community on a specific date
class BulkOrderResponse(BaseModel):
    community_id: int
    order_date: date
    products: list[BulkOrderProductResponse]
    status: str

class BulkOrderCycleResponse(BaseModel):
    community_id: int
    community_name: str
    order_date: date
    total_orders: int
    total_residents: int
    status: str