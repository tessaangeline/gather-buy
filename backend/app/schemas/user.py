from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.user import UserRole


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole
    community_id: int | None = None
    flat_number: str | None = None

class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    flat_number: str | None = None

class UserStatusUpdate(BaseModel):
    is_active: bool

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    community_id: int | None = None
    flat_number: str | None = None

    model_config = ConfigDict(from_attributes=True)