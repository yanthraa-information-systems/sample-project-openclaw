from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class ProjectMemberResponse(BaseModel):
    id: str
    user_id: str
    username: str
    full_name: Optional[str]
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    member_count: int = 0
    document_count: int = 0

    model_config = {"from_attributes": True}


class ProjectDetailResponse(ProjectResponse):
    members: List[ProjectMemberResponse] = []


class AddMemberRequest(BaseModel):
    user_id: str
    role: str = "viewer"


class UpdateMemberRoleRequest(BaseModel):
    role: str
