from typing import Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.schemas.user import UserCreate
from app.schemas.auth import LoginRequest, TokenResponse
from app.core.security import (
    hash_password,
    verify_password,
    create_token_pair,
    get_token_subject,
    decode_token,
    create_access_token,
)
from app.core.exceptions import AuthenticationError, ConflictError, NotFoundError
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: UserCreate) -> User:
        # Check email uniqueness
        existing_email = await self.db.execute(
            select(User).where(User.email == data.email)
        )
        if existing_email.scalar_one_or_none():
            raise ConflictError("Email already registered")

        # Check username uniqueness
        existing_username = await self.db.execute(
            select(User).where(User.username == data.username)
        )
        if existing_username.scalar_one_or_none():
            raise ConflictError("Username already taken")

        user = User(
            email=data.email,
            username=data.username,
            full_name=data.full_name,
            hashed_password=hash_password(data.password),
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)

        logger.info("user_registered", user_id=str(user.id), email=user.email)
        return user

    async def login(self, data: LoginRequest) -> TokenResponse:
        result = await self.db.execute(
            select(User).where(User.email == data.email)
        )
        user = result.scalar_one_or_none()

        if not user or not verify_password(data.password, user.hashed_password):
            raise AuthenticationError("Invalid email or password")

        if not user.is_active:
            raise AuthenticationError("Account is deactivated")

        access_token, refresh_token = create_token_pair(str(user.id), user.role.value)

        logger.info("user_logged_in", user_id=str(user.id))
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.jwt_access_token_expire_minutes * 60,
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        user_id = get_token_subject(refresh_token, token_type="refresh")

        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise AuthenticationError("User not found or inactive")

        access_token, new_refresh_token = create_token_pair(str(user.id), user.role.value)

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            expires_in=settings.jwt_access_token_expire_minutes * 60,
        )

    async def get_current_user(self, token: str) -> User:
        user_id = get_token_subject(token, token_type="access")
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise AuthenticationError("User not found")
        if not user.is_active:
            raise AuthenticationError("Account is deactivated")
        return user
