
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.repositories.user import add_wallet_balance


def top_up_wallet(
    db: Session,
    current_user: User,
    amount: Decimal
) -> dict:

    if current_user.role != UserRole.RESIDENT:
        raise PermissionError("Only residents can top up their wallet")

    if not current_user.is_active:
        raise PermissionError("Inactive accounts cannot top up their wallet")

    if amount <= 0:
        raise ValueError("Top-up amount must be greater than zero")

    try:
        updated = add_wallet_balance(
            db,
            current_user.id,
            amount
        )

        if not updated:
            raise PermissionError("Unable to update wallet balance")

        db.commit()

        db.refresh(current_user)

        return {
            "message": "Wallet topped up successfully",
            "wallet_balance": current_user.wallet_balance
        }

    except Exception:
        db.rollback()
        raise
