from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.repositories.user import get_user_by_email, create_user
from app.core.security import hash_password


ROLE_PERMISSIONS = {
    UserRole.SUPER_ADMIN: {
        UserRole.APARTMENT_ADMIN,
        UserRole.SUPPLIER
    },
    UserRole.APARTMENT_ADMIN: {
        UserRole.RESIDENT
    }
}


def register_user(
    db: Session,
    current_user: User,
    full_name: str,
    email: str,
    password: str,
    role: UserRole
):
    # 1. Check whether the current user can create this role
    allowed_roles = ROLE_PERMISSIONS.get(current_user.role, set())

    if role not in allowed_roles:
        raise PermissionError(
            "You are not authorized to create this account type"
        )

    # 2. Check whether email already exists
    existing_user = get_user_by_email(db, email)

    if existing_user:
        raise ValueError("Email already registered")

    # 3. Hash the password
    user_data = {
        "full_name": full_name,
        "email": email,
        "password_hash": hash_password(password),
        "role": role,
        "is_active": True
    }

    # 4. Save user
    return create_user(db, user_data)