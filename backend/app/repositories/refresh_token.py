from sqlalchemy.orm import Session

from app.models.refresh_token import RefreshToken


def get_refresh_token_by_hash(
    db: Session,
    token_hash: str
) -> RefreshToken | None:

    return (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash)
        .first()
    )


def revoke_refresh_token(
    db: Session,
    token: RefreshToken
) -> None:

    from datetime import datetime, timezone

    token.revoked_at = datetime.now(timezone.utc)
    db.add(token)