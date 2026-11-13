from fastapi import APIRouter, Depends, HTTPException, Response, status, Cookie

from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.schemas.auth import LoginRequest, LoginResponse
from app.schemas.user import UserResponse
from app.services.auth import login_user, logout_user
from app.services.refresh_token_service import refresh_user_session
from app.models.user import User, UserRole

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
def login(
    login_data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    try:
        user, access_token, refresh_token = login_user(
            db=db,
            email=login_data.email,
            password=login_data.password
        )

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,  # True in production with HTTPS
            samesite="lax",
            max_age=30 * 60,
            path="/"
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,  # True in production with HTTPS
            samesite="lax",
            max_age=7 * 24 * 60 * 60,
            path="/auth"
        )

        return {"message": "Login successful"}

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc)
        )


@router.post("/refresh")
def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db)
):
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )

    try:
        access_token, new_refresh_token = refresh_user_session(
            db,
            refresh_token
        )

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=30 * 60,
            path="/"
        )

        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=7 * 24 * 60 * 60,
            path="/auth"
        )

        return {"message": "Tokens refreshed successfully"}

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

@router.post("/logout")
def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db)
):
    logout_user(db, refresh_token)

    response.delete_cookie(
        key="access_token",
        path="/",
        httponly=True,
        secure=False,
        samesite="lax"
    )

    response.delete_cookie(
        key="refresh_token",
        path="/auth",
        httponly=True,
        secure=False,
        samesite="lax"
    )

    return {"message": "Logout successful"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

