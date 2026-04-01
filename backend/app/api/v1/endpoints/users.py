from fastapi import APIRouter, Query
from app.schemas.user import UserResponse, UserUpdate, ChangePasswordRequest
from app.schemas.common import PaginatedResponse, MessageResponse
from app.services.user_service import UserService
from app.api.deps import CurrentUser, AdminUser, DBSession
import math

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: CurrentUser):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_my_profile(data: UserUpdate, current_user: CurrentUser, db: DBSession):
    service = UserService(db)
    return await service.update_profile(current_user, data)


@router.post("/me/change-password", response_model=MessageResponse)
async def change_password(data: ChangePasswordRequest, current_user: CurrentUser, db: DBSession):
    service = UserService(db)
    await service.change_password(current_user, data)
    return MessageResponse(message="Password changed successfully")


@router.get("", response_model=PaginatedResponse[UserResponse])
async def list_users(
    _admin: AdminUser,
    db: DBSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
):
    service = UserService(db)
    users, total = await service.list_users(page=page, page_size=page_size, search=search)
    return PaginatedResponse(
        items=users, total=total, page=page,
        page_size=page_size, pages=math.ceil(total / page_size),
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, _admin: AdminUser, db: DBSession):
    service = UserService(db)
    return await service.get_by_id(user_id)
