from sqlalchemy.orm import Session

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