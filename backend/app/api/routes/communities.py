from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.community import CommunityCreate, CommunityResponse
from app.api.dependencies import  require_roles
from app.services.community import register_community


router = APIRouter(prefix="/communities", tags=["Communities"])


@router.post(
    "/",
    response_model=CommunityResponse,
    status_code=status.HTTP_201_CREATED
)
def create_community_api(
    community_data: CommunityCreate,
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    try:
        community = register_community(
            db=db,
            current_user=current_user,
            name=community_data.name,
            address=community_data.address
        )

        return community

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc)
        )