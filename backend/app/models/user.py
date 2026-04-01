from typing import List, Optional
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, UUIDMixin
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default=UserRole.USER.value, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    # Relationships
    owned_projects: Mapped[List["Project"]] = relationship(  # noqa: F821
        "Project", back_populates="owner", foreign_keys="Project.owner_id"
    )
    project_memberships: Mapped[List["ProjectMember"]] = relationship(  # noqa: F821
        "ProjectMember", back_populates="user"
    )
    documents: Mapped[List["Document"]] = relationship(  # noqa: F821
        "Document", back_populates="uploaded_by_user"
    )
    chat_sessions: Mapped[List["ChatSession"]] = relationship(  # noqa: F821
        "ChatSession", back_populates="user"
    )
    agent_runs: Mapped[List["AgentRun"]] = relationship(  # noqa: F821
        "AgentRun", back_populates="user"
    )
