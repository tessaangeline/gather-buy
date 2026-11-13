from sqlalchemy.orm import Session
from app.models.community import Community


def create_community(db: Session, community_data: dict) -> Community:
    community = Community(**community_data)

    db.add(community)
    db.commit()
    db.refresh(community)

    return community