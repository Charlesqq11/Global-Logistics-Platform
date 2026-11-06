from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.core.auth import get_current_user
from app.models.access import User
from app.schemas.auth import LoginRequest, LoginResponse, UserSummary


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> LoginResponse:
    statement = select(User).where(
        User.email == payload.email.lower()
    )

    user = db.scalar(statement)

    if user is None or not verify_password(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    user.last_login_at = datetime.now(timezone.utc)

    db.commit()

    token = create_access_token(user.id)

    return LoginResponse(
        access_token=token,
        user=UserSummary(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
        ),
    )

@router.get("/me")
def get_authenticated_user(
    current_user: User = Depends(get_current_user),
) -> UserSummary:
    return UserSummary(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
    )