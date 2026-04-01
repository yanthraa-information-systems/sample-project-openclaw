from fastapi import APIRouter
from app.services.user_service import UserService
from app.services.project_service import ProjectService
from app.services.document_service import DocumentService
from app.services.chat_service import ChatService
from app.api.deps import CurrentUser, DBSession
from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_users: int
    total_projects: int
    total_documents: int
    total_messages: int


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: CurrentUser, db: DBSession):
    """Get dashboard statistics."""
    user_service = UserService(db)
    project_service = ProjectService(db)
    doc_service = DocumentService(db)
    chat_service = ChatService(db)

    total_users = await user_service.get_total_count()
    total_projects = await project_service.get_total_count()
    total_documents = await doc_service.get_total_count()
    total_messages = await chat_service.get_total_message_count()

    return DashboardStats(
        total_users=total_users,
        total_projects=total_projects,
        total_documents=total_documents,
        total_messages=total_messages,
    )
