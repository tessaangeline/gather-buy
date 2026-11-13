from getpass import getpass

from sqlalchemy import select, func

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password


def create_super_admin():
    db = SessionLocal()

    try:
        # Allow bootstrap only when the users table is empty
        user_count = db.scalar(
            select(func.count()).select_from(User)
        )

        if user_count > 0:
            print("Users already exist. Bootstrap cancelled.")
            return

        full_name = input("Enter full name: ").strip()
        email = input("Enter email: ").strip().lower()
        password = getpass("Enter password: ")
        confirm_password = getpass("Confirm password: ")

        if not full_name or not email:
            print("Name and email cannot be empty.")
            return

        if len(password) < 12:
            print("Password must contain at least 12 characters.")
            return

        if password != confirm_password:
            print("Passwords do not match.")
            return

        admin = User(
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
            role=UserRole.SUPER_ADMIN,
            is_active=True
        )

        db.add(admin)
        db.commit()

        print("SUPER_ADMIN created successfully!")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    create_super_admin()