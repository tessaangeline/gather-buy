from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    verify_refresh_token,
)
from app.models.refresh_token import RefreshToken
from app.repositories.refresh_token import (
    get_refresh_token_by_hash,
)


def refresh_user_session(
    db: Session,
    refresh_token: str
):
    # 1. Hash the incoming refresh token
    incoming_hash = hash_refresh_token(refresh_token)

    # 2. Find the corresponding database record
    stored_token = get_refresh_token_by_hash(
        db,
        incoming_hash
    )

    # 3. Validate the token record
    if not stored_token:
        raise ValueError("Invalid refresh token")

    if stored_token.revoked_at is not None:
        raise ValueError("Refresh token has been revoked")

    if stored_token.expires_at <= datetime.now(timezone.utc):
        raise ValueError("Refresh token has expired")

    # 4. Get the associated user
    user = stored_token.user

    if not user or not user.is_active:
        raise ValueError("User account is inactive")

    # 5. Generate a new access token
    access_token = create_access_token({
        "sub": str(user.id),
        "role": user.role.value
    })

    # 6. Generate a new refresh token
    new_refresh_token = generate_refresh_token()

    new_expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )

    # 7. Revoke the old token
    stored_token.revoked_at = datetime.now(timezone.utc)

    # 8. Store the new refresh-token hash
    new_token_record = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(new_refresh_token),
        expires_at=new_expires_at
    )

    db.add(new_token_record)

    # 9. Commit both changes together
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return access_token, new_refresh_token