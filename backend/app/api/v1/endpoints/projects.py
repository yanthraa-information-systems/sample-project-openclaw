import math
from fastapi import APIRouter, Query
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    ProjectDetailResponse, AddMemberRequest,
)
from app.schemas.common import PaginatedResponse, MessageResponse
from app.services.project_service import ProjectService
from app.api.deps import CurrentUser, DBSession

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(data: ProjectCreate, current_user: CurrentUser, db: DBSession):
    service = ProjectService(db)
    return await service.create(data, current_user)


@router.get("", response_model=PaginatedResponse[ProjectResponse])
async def list_projects(
    current_user: CurrentUser, db: DBSession,
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
):
    service = ProjectService(db)
    projects, total = await service.list_for_user(current_user, page=page, page_size=page_size)
    return PaginatedResponse(
        items=projects, total=total, page=page,
        page_size=page_size, pages=math.ceil(total / page_size),
    )


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(project_id: str, current_user: CurrentUser, db: DBSession):
    service = ProjectService(db)
    return await service.assert_access(project_id, current_user)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, data: ProjectUpdate, current_user: CurrentUser, db: DBSession):
    service = ProjectService(db)
    project = await service.assert_access(project_id, current_user)
    return await service.update(project, data, current_user)


@router.delete("/{project_id}", response_model=MessageResponse)
async def delete_project(project_id: str, current_user: CurrentUser, db: DBSession):
    service = ProjectService(db)
    project = await service.assert_access(project_id, current_user)
    await service.delete(project, current_user)
    return MessageResponse(message="Project deleted successfully")


@router.post("/{project_id}/members", response_model=MessageResponse, status_code=201)
async def add_project_member(
    project_id: str, data: AddMemberRequest, current_user: CurrentUser, db: DBSession,
):
    service = ProjectService(db)
    project = await service.assert_access(project_id, current_user)
    await service.add_member(project, data, current_user)
    return MessageResponse(message="Member added successfully")


@router.delete("/{project_id}/members/{user_id}", response_model=MessageResponse)
async def remove_project_member(
    project_id: str, user_id: str, current_user: CurrentUser, db: DBSession,
):
    service = ProjectService(db)
    project = await service.assert_access(project_id, current_user)
    await service.remove_member(project, user_id, current_user)
    return MessageResponse(message="Member removed successfully")
