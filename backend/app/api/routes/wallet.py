
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.api.dependencies import require_roles
from app.schemas.wallet import WalletTopUpRequest, WalletResponse
from app.services.wallet import top_up_wallet


router = APIRouter(
    prefix="/wallet",
    tags=["Wallet"]
)


@router.post(
    "/top-up",
    response_model=WalletResponse
)
def top_up_wallet_api(
    request: WalletTopUpRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.RESIDENT)
    )
):
    try:
        return top_up_wallet(
            db=db,
            current_user=current_user,
            amount=request.amount
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=403,
            detail=str(exc)
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )
