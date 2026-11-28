import uuid

from pydantic import BaseModel, ConfigDict
from sqlalchemy import DDL, ForeignKey, String, event
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class User(Base):

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    role: Mapped[str] = mapped_column(
        String(30),
        default="customer",
        nullable=False
    )

class UserAuthIdentity(Base):
    __tablename__ = "user_auth_identities"

    auth_id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )


# Only the backend's database connection needs access to these mappings.
event.listen(
    UserAuthIdentity.__table__,
    "after_create",
    DDL("ALTER TABLE user_auth_identities ENABLE ROW LEVEL SECURITY").execute_if(
        dialect="postgresql"
    ),
)


class UserProfile(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str

    model_config = ConfigDict(from_attributes=True)
