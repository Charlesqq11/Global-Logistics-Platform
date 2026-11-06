from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.auth import require_permission
from app.core.database import get_db
from app.core.security import hash_password
from app.models.access import User
from app.models.customer import Customer
from app.schemas.customer import (
    CustomerCreate,
    CustomerResponse,
    CustomerStaffCreate,
    CustomerStaffLink,
    CustomerStaffResponse,
)


router = APIRouter(
    prefix="/admin/customers",
    tags=["Admin Customers"],
)


def get_customer_or_404(
    db: Session,
    customer_id: UUID,
) -> Customer:
    customer = db.get(Customer, customer_id)

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    return customer


@router.post(
    "",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("customers.manage")
    ),
):
    customer = Customer(
        customer_code=f"CUST-{uuid4().hex[:12].upper()}",
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        email=(
            str(payload.email).lower()
            if payload.email else None
        ),
        phone=payload.phone,
        company_name=payload.company_name,
        country=payload.country,
        preferred_language=payload.preferred_language,
        notes=payload.notes,
    )

    db.add(customer)

    try:
        db.commit()
        db.refresh(customer)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not create customer because of a conflicting record.",
        ) from exc

    return customer


@router.get(
    "",
    response_model=list[CustomerResponse],
)
def list_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("customers.read")
    ),
):
    statement = (
        select(Customer)
        .order_by(Customer.created_at.desc())
    )

    return db.scalars(statement).all()


@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
)
def get_customer(
    customer_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("customers.read")
    ),
):
    return get_customer_or_404(db, customer_id)


@router.get(
    "/{customer_id}/staff",
    response_model=list[CustomerStaffResponse],
)
def list_customer_staff(
    customer_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("customers.read")
    ),
):
    customer = get_customer_or_404(db, customer_id)

    statement = (
        select(User)
        .join(User.customers)
        .where(Customer.id == customer.id)
        .order_by(User.created_at.desc())
    )

    return db.scalars(statement).unique().all()


@router.post(
    "/{customer_id}/staff",
    response_model=CustomerStaffResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_customer_staff(
    customer_id: UUID,
    payload: CustomerStaffCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("customers.manage")
    ),
):
    customer = get_customer_or_404(db, customer_id)

    if not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Staff cannot be added to an inactive customer.",
        )

    email = str(payload.email).lower()

    existing_user = db.scalar(
        select(User).where(User.email == email)
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists. Use the existing-account linking endpoint instead.",
        )

    if len(payload.password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must not exceed 72 UTF-8 bytes.",
        )

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        is_active=True,
        is_verified=False,
    )

    user.customers.append(customer)

    db.add(user)

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not create staff account. The email may already be registered.",
        ) from exc

    return user


@router.post(
    "/{customer_id}/staff/link",
    response_model=CustomerStaffResponse,
)
def link_existing_customer_staff(
    customer_id: UUID,
    payload: CustomerStaffLink,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("customers.manage")
    ),
):
    customer = get_customer_or_404(db, customer_id)

    if not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Staff cannot be linked to an inactive customer.",
        )

    email = str(payload.email).lower()

    statement = (
        select(User)
        .where(User.email == email)
        .options(selectinload(User.roles))
    )

    user = db.scalar(statement)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user accounts cannot be linked.",
        )

    if user.roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Accounts with administrative roles cannot be linked as customer staff.",
        )

    if customer in user.customers:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This user is already linked to the customer.",
        )

    user.customers.append(customer)

    db.commit()
    db.refresh(user)

    return user


@router.delete(
    "/{customer_id}/staff/{user_id}",
)
def unlink_customer_staff(
    customer_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("customers.manage")
    ),
):
    customer = get_customer_or_404(db, customer_id)

    statement = (
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.customers))
    )

    user = db.scalar(statement)

    if user is None or customer not in user.customers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer staff account not found.",
        )

    user.customers.remove(customer)
    db.commit()

    return {
        "message": "Staff account unlinked successfully.",
        "customer_id": str(customer.id),
        "user_id": str(user.id),
    }