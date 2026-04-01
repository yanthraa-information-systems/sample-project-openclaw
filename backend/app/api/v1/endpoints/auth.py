from fastapi import APIRouter
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest
from app.schemas.common import MessageResponse
from app.services.auth_service import AuthService
from app.api.deps import CurrentUser, DBSession

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: UserCreate, db: DBSession):
    """Register a new user account."""
    service = AuthService(db)
    user = await service.register(data)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: DBSession):
    """Authenticate and receive JWT tokens."""
    service = AuthService(db)
    return await service.login(data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshTokenRequest, db: DBSession):
    """Refresh access token using a valid refresh token."""
    service = AuthService(db)
    return await service.refresh(data.refresh_token)


@router.post("/logout", response_model=MessageResponse)
async def logout(current_user: CurrentUser):
    """
    Logout endpoint. On the client side, discard the stored tokens.
    For stateless JWT, server-side invalidation requires a token denylist
    (e.g., Redis). That can be added here as needed.
    """
    return MessageResponse(message="Successfully logged out")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser):
    """Get current authenticated user details."""
    return current_user
