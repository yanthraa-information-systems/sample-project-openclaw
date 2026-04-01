from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.models.project import Project, ProjectMember, ProjectStatus, MemberRole
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate, AddMemberRequest
from app.core.exceptions import NotFoundError, AuthorizationError, ConflictError
from app.core.logging import get_logger

logger = get_logger(__name__)


class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: ProjectCreate, owner: User) -> Project:
        project = Project(
            name=data.name,
            description=data.description,
            owner_id=owner.id,
        )
        self.db.add(project)
        await self.db.flush()

        member = ProjectMember(
            project_id=project.id,
            user_id=owner.id,
            role=MemberRole.OWNER.value,
        )
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(project)
        logger.info("project_created", project_id=project.id, owner_id=owner.id)
        return project

    async def get_by_id(self, project_id: str) -> Project:
        result = await self.db.execute(
            select(Project)
            .options(selectinload(Project.members).selectinload(ProjectMember.user))
            .where(Project.id == project_id, Project.status != ProjectStatus.DELETED.value)
        )
        project = result.scalar_one_or_none()
        if not project:
            raise NotFoundError("Project", project_id)
        return project

    async def assert_access(self, project_id: str, user: User) -> Project:
        project = await self.get_by_id(project_id)
        if project.owner_id == user.id:
            return project
        member_result = await self.db.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user.id,
            )
        )
        if not member_result.scalar_one_or_none():
            raise AuthorizationError("You do not have access to this project")
        return project

    async def list_for_user(
        self, user: User, page: int = 1, page_size: int = 20
    ) -> Tuple[List[Project], int]:
        subquery = select(ProjectMember.project_id).where(ProjectMember.user_id == user.id)
        query = select(Project).where(
            Project.status != ProjectStatus.DELETED.value,
            Project.id.in_(subquery),
        )
        count_query = select(func.count(Project.id)).where(
            Project.status != ProjectStatus.DELETED.value,
            Project.id.in_(subquery),
        )

        total = (await self.db.execute(count_query)).scalar_one()
        offset = (page - 1) * page_size
        projects = (
            await self.db.execute(
                query.order_by(Project.updated_at.desc()).offset(offset).limit(page_size)
            )
        ).scalars().all()

        return list(projects), total

    async def update(self, project: Project, data: ProjectUpdate, user: User) -> Project:
        if project.owner_id != user.id:
            raise AuthorizationError("Only the project owner can update it")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(project, field, value)
        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def delete(self, project: Project, user: User) -> None:
        if project.owner_id != user.id:
            raise AuthorizationError("Only the project owner can delete it")
        project.status = ProjectStatus.DELETED.value
        await self.db.flush()
        logger.info("project_deleted", project_id=project.id)

    async def add_member(self, project: Project, data: AddMemberRequest, requester: User) -> ProjectMember:
        if project.owner_id != requester.id:
            raise AuthorizationError("Only the project owner can add members")
        existing = await self.db.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == project.id,
                ProjectMember.user_id == data.user_id,
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictError("User is already a member of this project")
        member = ProjectMember(project_id=project.id, user_id=data.user_id, role=data.role)
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(member)
        return member

    async def remove_member(self, project: Project, member_user_id: str, requester: User) -> None:
        if project.owner_id != requester.id:
            raise AuthorizationError("Only the project owner can remove members")
        if member_user_id == project.owner_id:
            raise ConflictError("Cannot remove project owner")
        result = await self.db.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == project.id,
                ProjectMember.user_id == member_user_id,
            )
        )
        member = result.scalar_one_or_none()
        if not member:
            raise NotFoundError("Project member", member_user_id)
        await self.db.delete(member)
        await self.db.flush()

    async def get_total_count(self) -> int:
        result = await self.db.execute(
            select(func.count(Project.id)).where(Project.status != ProjectStatus.DELETED.value)
        )
        return result.scalar_one()
