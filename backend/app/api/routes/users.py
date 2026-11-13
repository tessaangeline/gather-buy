
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse
from app.api.dependencies import require_roles
from app.services.user import (
    register_user,
    list_apartment_admins,
    list_suppliers,
    list_residents
)


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

@router.get("/apartment-admins", response_model=list[UserResponse])
def get_apartment_admins_api(
    current_user: User = Depends(
        require_roles(UserRole.SUPER_ADMIN)
    ),
    db: Session = Depends(get_db)
):
    return list_apartment_admins(db)


@router.get("/suppliers", response_model=list[UserResponse])
def get_suppliers_api(
    current_user: User = Depends(
        require_roles(UserRole.SUPER_ADMIN)
    ),
    db: Session = Depends(get_db)
):
    return list_suppliers(db)


@router.get("/residents", response_model=list[UserResponse])
def get_residents_api(
    current_user: User = Depends(
        require_roles(UserRole.APARTMENT_ADMIN)
    ),
    db: Session = Depends(get_db)
):
    try:
        return list_residents(db, current_user)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )