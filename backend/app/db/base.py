from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass

from app.models.refresh_token import RefreshToken
from app.models.user import User