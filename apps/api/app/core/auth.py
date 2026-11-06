from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.access import User, Role


bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db),
) -> User:
    user_id = decode_access_token(
        credentials.credentials
    )

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    statement = (
        select(User)
        .where(
            User.id == user_id,
            User.is_active.is_(True),
        )
        .options(
            selectinload(User.roles).selectinload(
                Role.permissions
            )
        )
    )

    user = db.scalar(statement)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_permission(permission_name: str):
    def permission_dependency(
        current_user: User = Depends(get_current_user),
    ) -> User:
        has_permission = any(
            permission.name == permission_name
            for role in current_user.roles
            if role.is_active
            for permission in role.permissions
        )

        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )

        return current_user

    return permission_dependency