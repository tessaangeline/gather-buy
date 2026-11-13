
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse
from app.api.dependencies import require_roles
from app.services.user import register_user


router = APIRouter(prefix="/users", tags=["Users"])


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_user_api(
    user_data: UserCreate,
    current_user: User = Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.APARTMENT_ADMIN
        )
    ),
    db: Session = Depends(get_db)
):
    try:
        user = register_user(
            db=db,
            current_user=current_user,
            full_name=user_data.full_name,
            email=str(user_data.email),
            password=user_data.password,
            role=user_data.role,
            community_id=user_data.community_id,
            flat_number=user_data.flat_number
        )

        return user

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc)
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )
