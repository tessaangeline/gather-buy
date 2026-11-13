from sqlalchemy.orm import Session
from app.models.community import Community


def create_community(db: Session, community_data: dict) -> Community:
    community = Community(**community_data)

    db.add(community)
    db.commit()
    db.refresh(community)

    return community


def get_community_by_id(
    db: Session,
    community_id: int
) -> Community | None:

    return (
        db.query(Community)
        .filter(Community.id == community_id)
        .first()
    )

def get_all_communities(db: Session) -> list[Community]:
    return db.query(Community).all()
