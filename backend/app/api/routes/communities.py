
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.community import (
    CommunityCreate,
    CommunityUpdate,
    CommunityResponse,
)
from app.api.dependencies import require_roles
from app.services.community import (
    register_community,
    list_communities,
    edit_community_by_id,
    delete_community_by_id,
)


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
        return register_community(
            db=db,
            current_user=current_user,
            name=community_data.name,
            address=community_data.address
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc)
        )


@router.get(
    "/",
    response_model=list[CommunityResponse]
)
def get_communities_api(
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    return list_communities(db)


@router.put(
    "/{community_id}",
    response_model=CommunityResponse
)
def update_community_api(
    community_id: int,
    community_data: CommunityUpdate,
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    try:
        update_data = community_data.model_dump(
            exclude_unset=True,
            exclude_none=True
        )

        return edit_community_by_id(
            db=db,
            current_user=current_user,
            community_id=community_id,
            update_data=update_data
        )

    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/{community_id}")
def delete_community_api(
    community_id: int,
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    try:
        delete_community_by_id(
            db=db,
            current_user=current_user,
            community_id=community_id
        )

        return {"message": "Community deleted successfully"}

    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
