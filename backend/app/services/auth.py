from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.repositories.user import get_user_by_email
from app.core.security import (
    verify_password,
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
)
from app.core.config import settings
from app.models.refresh_token import RefreshToken
from app.repositories.refresh_token import get_refresh_token_by_hash


def login_user(
    db: Session,
    email: str,
    password: str
):
    # 1. Find user by email
    user = get_user_by_email(db, email)

    # 2. Verify credentials
    if not user or not verify_password(
        password,
        user.password_hash
    ):
        raise ValueError("Invalid email or password")

    # 3. Check whether account is active
    if not user.is_active:
        raise ValueError("Invalid email or password")

    # 4. Generate access token
    access_token = create_access_token({
        "sub": str(user.id),
        "role": user.role.value
    })

    # 5. Generate refresh token
    refresh_token = generate_refresh_token()

    # 6. Calculate refresh-token expiry
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )

    # 7. Store only the refresh-token hash
    token_record = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(refresh_token),
        expires_at=expires_at
    )

    db.add(token_record)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    # Return original refresh token only to the route.
    return user, access_token, refresh_token

def logout_user(db: Session, refresh_token: str | None):
    if not refresh_token:
        return

    token_hash = hash_refresh_token(refresh_token)

    stored_token = get_refresh_token_by_hash(db, token_hash)

    if stored_token and stored_token.revoked_at is None:
        stored_token.revoked_at = datetime.now(timezone.utc)

        try:
            db.commit()
        except Exception:
            db.rollback()
            raise