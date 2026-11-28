import uuid
from functools import lru_cache
from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from httpx import RequestError
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from supabase import AuthApiError, AuthError, ClientOptions, create_client

from app.core.config import settings
from app.database.connection import get_db
from app.models.user import User, UserAuthIdentity

bearer = HTTPBearer(auto_error=False)
DbSession = Annotated[Session, Depends(get_db)]


@lru_cache
def supabase_auth():
    if not settings.SUPABASE_URL or not settings.SUPABASE_PUBLISHABLE_KEY:
        raise HTTPException(
            status_code=503,
            detail="Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in the backend .env",
        )

    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_PUBLISHABLE_KEY,
        options=ClientOptions(auto_refresh_token=False, persist_session=False),
    ).auth


def unauthorized():
    return HTTPException(
        status_code=401,
        detail="A valid Supabase access token is required",
        headers={"WWW-Authenticate": "Bearer"},
    )


def linked_user(db: Session, auth_id: uuid.UUID) -> User | None:
    return db.scalar(
        select(User)
        .join(UserAuthIdentity, User.id == UserAuthIdentity.user_id)
        .where(UserAuthIdentity.auth_id == auth_id)
    )


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    db: DbSession,
) -> User:
    if credentials is None:
        raise unauthorized()

    try:
        response = supabase_auth().get_user(credentials.credentials)
    except AuthApiError as exc:
        if exc.status in (400, 401, 403, 404, 422):
            raise unauthorized() from exc
        raise HTTPException(status_code=503, detail="Supabase Auth is unavailable") from exc
    except (AuthError, RequestError) as exc:
        raise HTTPException(status_code=503, detail="Supabase Auth is unavailable") from exc

    if response is None or response.user.is_anonymous:
        raise unauthorized()

    identity = response.user
    auth_id = uuid.UUID(identity.id)
    user = linked_user(db, auth_id)
    if user is not None:
        return user

    if not identity.email or not identity.email_confirmed_at:
        raise HTTPException(status_code=403, detail="Confirm your email to use ResolveAI")

    email = identity.email.strip().lower()
    user = db.get(User, auth_id)
    if user is None:
        # Preserve legacy user IDs so existing tickets and messages keep their owners.
        matches = db.scalars(
            select(User).where(func.lower(User.email) == email).limit(2)
        ).all()
        if len(matches) > 1:
            raise HTTPException(status_code=409, detail="Multiple profiles match this email")
        if matches:
            user = matches[0]

    if user is None:
        name = identity.user_metadata.get("full_name")
        full_name = name.strip() if isinstance(name, str) else ""
        user = User(
            id=auth_id,
            email=email,
            full_name=(full_name or email.split("@", 1)[0])[:150],
            role="customer",
        )
        db.add(user)

    try:
        db.flush()
        db.add(UserAuthIdentity(auth_id=auth_id, user_id=user.id))
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        user = linked_user(db, auth_id)
        if user is None:
            raise HTTPException(
                status_code=409, detail="This email is already associated with another profile"
            ) from exc

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
