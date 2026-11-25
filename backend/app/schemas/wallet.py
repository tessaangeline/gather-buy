
from decimal import Decimal

from pydantic import BaseModel, Field


class WalletTopUpRequest(BaseModel):
    amount: Decimal = Field(
        gt=0,
        le=10000,
        max_digits=10,
        decimal_places=2
    )


class WalletResponse(BaseModel):
    message: str
    wallet_balance: Decimal
