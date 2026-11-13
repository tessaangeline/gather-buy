from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.repositories.community import create_community, get_all_communities


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