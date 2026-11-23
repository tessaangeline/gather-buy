
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from decimal import Decimal

from app.models.user import User, UserRole
from app.repositories.user import (
    get_user_by_email, 
    get_user_by_id,
    create_user, 
    update_user,
    update_user_status,
    get_apartment_admins,
    get_suppliers,
    get_residents_by_community
)
from app.repositories.community import get_community_by_id
from app.core.security import hash_password

class SupplierAlreadyExistsError(Exception):
    pass

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

    # Only one Supplier account is allowed in the application
    if role == UserRole.SUPPLIER:
        existing_suppliers = get_suppliers(db)

        if existing_suppliers:
            raise SupplierAlreadyExistsError(
                "A supplier account already exists. "
                "Only one supplier is allowed."
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
    wallet_balance = (
        Decimal("1000.00")
        if role == UserRole.RESIDENT
        else None
    )

    user_data = {
        "full_name": full_name.strip(),
        "email": email,
        "password_hash": hash_password(password),
        "role": role,
        "community_id": assigned_community_id,
        "flat_number": flat_number if role == UserRole.RESIDENT else None,
        "wallet_balance": wallet_balance,
        "is_active": True
    }

    # 5. Save user

    try:
        return create_user(db, user_data)

    except IntegrityError as exc:
        db.rollback()

        # Check whether the database rejected this because
        # another Supplier account already exists.
        constraint_name = getattr(
            getattr(exc.orig, "diag", None),
            "constraint_name",
            None
        )

        if (
            role == UserRole.SUPPLIER
            and constraint_name == "uq_users_single_supplier"
        ):
            raise SupplierAlreadyExistsError(
                "A supplier account already exists. "
                "Only one supplier is allowed."
            ) from exc

        raise


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

def edit_user(
    db: Session,
    current_user: User,
    target_user: User,
    update_data: dict
) -> User:

    # 1. Check whether the current user can edit the target user
    if current_user.role == UserRole.SUPER_ADMIN:
        if target_user.role not in {
            UserRole.APARTMENT_ADMIN,
            UserRole.SUPPLIER
        }:
            raise PermissionError(
                "Super Admin can only edit Apartment Admins and Suppliers"
            )

    elif current_user.role == UserRole.APARTMENT_ADMIN:
        if target_user.role != UserRole.RESIDENT:
            raise PermissionError(
                "Apartment Admin can only edit Residents"
            )

        if target_user.community_id != current_user.community_id:
            raise PermissionError(
                "You can only edit Residents in your own community"
            )

    else:
        raise PermissionError(
            "You are not authorized to edit users"
        )

    # 2. Check whether the email is already used by another account
    if "email" in update_data:
        email = update_data["email"].strip().lower()

        existing_user = get_user_by_email(db, email)

        if existing_user and existing_user.id != target_user.id:
            raise ValueError("Email already registered")

        update_data["email"] = email

    # 3. Validate and clean the provided fields
    if "full_name" in update_data:
        if not update_data["full_name"].strip():
            raise ValueError("Full name cannot be empty")

        update_data["full_name"] = update_data["full_name"].strip()

    if "flat_number" in update_data:
        if target_user.role != UserRole.RESIDENT:
            raise ValueError("Flat number can only be updated for Residents")

        if not update_data["flat_number"].strip():
            raise ValueError("Flat number cannot be empty")

        update_data["flat_number"] = update_data["flat_number"].strip()

    # 4. Update the database record
    return update_user(db, target_user, update_data)

def edit_user_by_id(
    db: Session,
    current_user: User,
    user_id: int,
    update_data: dict
) -> User:

    target_user = get_user_by_id(db, user_id)

    if not target_user:
        raise LookupError("User not found")

    return edit_user(
        db=db,
        current_user=current_user,
        target_user=target_user,
        update_data=update_data
    )

def change_user_status(
    db: Session,
    current_user: User,
    user_id: int,
    is_active: bool
) -> User:

    # 1. Find the target user
    target_user = get_user_by_id(db, user_id)

    if not target_user:
        raise LookupError("User not found")

    # 2. Check permissions
    if current_user.role == UserRole.SUPER_ADMIN:

        if target_user.role not in {
            UserRole.APARTMENT_ADMIN,
            UserRole.SUPPLIER
        }:
            raise PermissionError(
                "Super Admin can only manage Apartment Admins and Suppliers"
            )

    elif current_user.role == UserRole.APARTMENT_ADMIN:

        if target_user.role != UserRole.RESIDENT:
            raise PermissionError(
                "Apartment Admin can only manage Residents"
            )

        if target_user.community_id != current_user.community_id:
            raise PermissionError(
                "You can only manage Residents in your own community"
            )

    else:
        raise PermissionError(
            "You are not authorized to manage users"
        )

    # 3. Update account status
    return update_user_status(
        db=db,
        user=target_user,
        is_active=is_active
    )