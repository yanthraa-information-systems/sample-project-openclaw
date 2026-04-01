from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User
from app.schemas.user import UserUpdate, UserAdminUpdate, ChangePasswordRequest
from app.core.security import verify_password, hash_password
from app.core.exceptions import NotFoundError, AuthenticationError
from app.core.logging import get_logger

logger = get_logger(__name__)


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: str) -> User:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError("User", user_id)
        return user

    async def update_profile(self, user: User, data: UserUpdate) -> User:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(user, field, value)
        await self.db.flush()
        await self.db.refresh(user)
        logger.info("user_profile_updated", user_id=user.id)
        return user

    async def change_password(self, user: User, data: ChangePasswordRequest) -> None:
        if not verify_password(data.current_password, user.hashed_password):
            raise AuthenticationError("Current password is incorrect")
        user.hashed_password = hash_password(data.new_password)
        await self.db.flush()
        logger.info("user_password_changed", user_id=user.id)

    async def list_users(
        self, page: int = 1, page_size: int = 20, search: Optional[str] = None
    ) -> tuple[List[User], int]:
        query = select(User)
        count_query = select(func.count(User.id))

        if search:
            search_filter = (
                User.email.ilike(f"%{search}%") | User.username.ilike(f"%{search}%")
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        total = (await self.db.execute(count_query)).scalar_one()
        offset = (page - 1) * page_size
        users = (
            await self.db.execute(
                query.order_by(User.created_at.desc()).offset(offset).limit(page_size)
            )
        ).scalars().all()

        return list(users), total

    async def admin_update(self, user_id: str, data: UserAdminUpdate) -> User:
        user = await self.get_by_id(user_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(user, field, value)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def get_total_count(self) -> int:
        result = await self.db.execute(select(func.count(User.id)))
        return result.scalar_one()
