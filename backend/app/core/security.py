import secrets
import hashlib
import hmac

from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from jose import jwt
from app.core.config import settings


# ---------------- PASSWORD SECURITY ----------------

password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    try:
        return password_hasher.verify(
            hashed_password,
            plain_password
        )
    except VerifyMismatchError:
        return False


# ---------------- ACCESS TOKEN ----------------

def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None
) -> str:

    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM]
    )


# ---------------- REFRESH TOKEN ----------------

def generate_refresh_token() -> str:
    return secrets.token_urlsafe(64)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


def verify_refresh_token(
    token: str,
    stored_hash: str
) -> bool:
    token_hash = hash_refresh_token(token)

    return hmac.compare_digest(
        token_hash,
        stored_hash
    )