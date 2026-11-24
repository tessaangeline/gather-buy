
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.repositories.community import (
    create_community,
    get_all_communities,
    get_community_by_id,
    update_community,
    delete_community,
)


def register_community(
    db: Session,
    current_user: User,
    name: str,
    address: str
):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise PermissionError(
            "Only Super Admin can create communities"
        )

    community_data = {
        "name": name,
        "address": address
    }

    return create_community(db, community_data)


def list_communities(db: Session):
    return get_all_communities(db)


def edit_community_by_id(
    db: Session,
    current_user: User,
    community_id: int,
    update_data: dict
):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise PermissionError(
            "Only Super Admin can edit communities"
        )

    community = get_community_by_id(db, community_id)

    if not community:
        raise LookupError("Community not found")

    if not update_data:
        raise ValueError("No fields provided for update")

    for field in ("name", "address"):
        if field in update_data:
            value = update_data[field].strip()

            if not value:
                raise ValueError(f"{field.capitalize()} cannot be empty")

            update_data[field] = value

    return update_community(db, community, update_data)


def delete_community_by_id(
    db: Session,
    current_user: User,
    community_id: int
):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise PermissionError(
            "Only Super Admin can delete communities"
        )

    community = get_community_by_id(db, community_id)

    if not community:
        raise LookupError("Community not found")

    # Prevent deletion if users are assigned to this community
    assigned_users = (
        db.query(User)
        .filter(User.community_id == community_id)
        .first()
    )

    if assigned_users:
        raise ValueError(
            "Cannot delete this community because users are assigned to it"
        )

    delete_community(db, community)
