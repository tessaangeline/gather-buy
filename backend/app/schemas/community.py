from pydantic import BaseModel, ConfigDict


class CommunityCreate(BaseModel):
    name: str
    address: str

class CommunityUpdate(BaseModel):
    name: str | None = None
    address: str | None = None


class CommunityResponse(BaseModel):
    id: int
    name: str
    address: str

    model_config = ConfigDict(from_attributes=True)