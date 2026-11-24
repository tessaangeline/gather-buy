
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse, UserUpdate, UserStatusUpdate
from app.api.dependencies import require_roles
from app.services.user import (
    register_user,
    list_apartment_admins,
    list_suppliers,
    list_residents,
    edit_user_by_id,
    change_user_status,
    SupplierAlreadyExistsError,
    delete_user_by_id,
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

    except SupplierAlreadyExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
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

@router.put("/{user_id}", response_model=UserResponse)
def update_user_api(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(
        require_roles(UserRole.SUPER_ADMIN, UserRole.APARTMENT_ADMIN)
    ),
    db: Session = Depends(get_db)
):
    update_data = user_data.model_dump(
        exclude_unset=True,
        exclude_none=True
    )

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be provided"
        )

    try:
        return edit_user_by_id(
            db=db,
            current_user=current_user,
            user_id=user_id,
            update_data=update_data
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc)
        )

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

@router.patch("/{user_id}/status", response_model=UserResponse)
def update_user_status_api(
    user_id: int,
    status_data: UserStatusUpdate,
    current_user: User = Depends(
        require_roles(UserRole.SUPER_ADMIN, UserRole.APARTMENT_ADMIN)
    ),
    db: Session = Depends(get_db)
):
    try:
        return change_user_status(
            db=db,
            current_user=current_user,
            user_id=user_id,
            is_active=status_data.is_active
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc)
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc)
        )

@router.delete("/{user_id}")
def delete_user_api(
    user_id: int,
    current_user: User = Depends(
        require_roles(UserRole.SUPER_ADMIN)
    ),
    db: Session = Depends(get_db)
):
    try:
        delete_user_by_id(
            db=db,
            current_user=current_user,
            user_id=user_id
        )

        return {
            "message": "User deleted successfully"
        }

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc)
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc)
        )