from sqlalchemy.orm import Session
from sqlalchemy import update, func
from decimal import Decimal

from app.models.user import User, UserRole


def get_user_by_email(
    db: Session,
    email: str
) -> User | None:

    return (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

def create_user(db: Session, user_data: dict) -> User:
    user = User(**user_data)

    db.add(user)
    db.commit()
    db.refresh(user)

    return user

def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()

def get_apartment_admins(db: Session) -> list[User]:
    return (
        db.query(User)
        .filter(User.role == UserRole.APARTMENT_ADMIN)
        .all()
    )


def get_suppliers(db: Session) -> list[User]:
    return (
        db.query(User)
        .filter(User.role == UserRole.SUPPLIER)
        .all()
    )


def get_residents_by_community(
    db: Session,
    community_id: int
) -> list[User]:
    return (
        db.query(User)
        .filter(
            User.role == UserRole.RESIDENT,
            User.community_id == community_id
        )
        .all()
    )

def update_user(db: Session, user: User, update_data: dict) -> User:
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return user

def update_user_status(
    db: Session,
    user: User,
    is_active: bool
) -> User:

    user.is_active = is_active

    db.commit()
    db.refresh(user)

    return user

def deduct_wallet_balance(
    db: Session,
    user_id: int,
    amount: Decimal
) -> bool:

    result = db.execute(
        update(User)
        .where(
            User.id == user_id,
            func.coalesce(
                User.wallet_balance,
                Decimal("0.00")
            ) >= amount
        )
        .values(
            wallet_balance=func.coalesce(
                User.wallet_balance,
                Decimal("0.00")
            ) - amount
        )
        .execution_options(synchronize_session=False)
    )

    return result.rowcount == 1


def add_wallet_balance(
    db: Session,
    user_id: int,
    amount: Decimal
) -> bool:

    result = db.execute(
        update(User)
        .where(
            User.id == user_id,
            User.role == UserRole.RESIDENT,
            User.is_active.is_(True)
        )
        .values(
            wallet_balance=func.coalesce(
                User.wallet_balance,
                Decimal("0.00")
            ) + amount
        )
        .execution_options(synchronize_session=False)
    )

    return result.rowcount == 1


def delete_user(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()

