from pydantic import BaseModel, ConfigDict


class CommunityCreate(BaseModel):
    name: str
    address: str


class CommunityResponse(BaseModel):
    id: int
    name: str
    address: str

    model_config = ConfigDict(from_attributes=True)