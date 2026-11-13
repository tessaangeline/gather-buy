
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.repositories.user import (
    get_user_by_email, 
    create_user, 
    get_apartment_admins,
    get_suppliers,
    get_residents_by_community
)
from app.repositories.community import get_community_by_id
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
    role: UserRole,
    community_id: int | None = None,
    flat_number: str | None = None
):
    # 1. Check whether the current user can create this role
    allowed_roles = ROLE_PERMISSIONS.get(current_user.role, set())

    if role not in allowed_roles:
        raise PermissionError(
            "You are not authorized to create this account type"
        )

    # 2. Check whether email already exists
    email = email.strip().lower()

    existing_user = get_user_by_email(db, email)

    if existing_user:
        raise ValueError("Email already registered")

    # 3. Determine community based on the logged-in user's role
    assigned_community_id = None

    if current_user.role == UserRole.SUPER_ADMIN:

        if role == UserRole.APARTMENT_ADMIN:
            if community_id is None:
                raise ValueError(
                    "Community ID is required for an Apartment Admin"
                )

            community = get_community_by_id(db, community_id)

            if not community:
                raise ValueError("Community does not exist")

            assigned_community_id = community.id

        elif role == UserRole.SUPPLIER:
            if community_id is not None or flat_number is not None:
                raise ValueError(
                    "Supplier cannot be assigned to a community or flat"
                )

    elif current_user.role == UserRole.APARTMENT_ADMIN:

        if current_user.community_id is None:
            raise ValueError(
                "Apartment Admin is not assigned to a community"
            )

        if not flat_number or not flat_number.strip():
            raise ValueError(
                "Flat number is required for a Resident"
            )

        # Never trust the community ID sent by the frontend.
        assigned_community_id = current_user.community_id
        flat_number = flat_number.strip()

    # 4. Prepare user data
    user_data = {
        "full_name": full_name.strip(),
        "email": email,
        "password_hash": hash_password(password),
        "role": role,
        "community_id": assigned_community_id,
        "flat_number": flat_number if role == UserRole.RESIDENT else None,
        "is_active": True
    }

    # 5. Save user
    return create_user(db, user_data)


def list_apartment_admins(db: Session):
    return get_apartment_admins(db)


def list_suppliers(db: Session):
    return get_suppliers(db)


def list_residents(db: Session, current_user: User):
    if current_user.community_id is None:
        raise ValueError("Apartment Admin is not assigned to a community")

    return get_residents_by_community(
        db,
        current_user.community_id
    )