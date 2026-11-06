from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)

    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)

    company_name: str | None = Field(
        default=None,
        max_length=255,
    )

    country: str | None = Field(
        default=None,
        max_length=100,
    )

    preferred_language: str = Field(
        default="en",
        min_length=2,
        max_length=10,
    )

    notes: str | None = None


class CustomerStaffCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)

    email: EmailStr

    password: str = Field(
        min_length=12,
        max_length=72,
    )


class CustomerStaffLink(BaseModel):
    email: EmailStr


class CustomerStaffResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    is_active: bool


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    customer_code: str
    first_name: str
    last_name: str
    email: str | None
    phone: str | None
    company_name: str | None
    country: str | None
    preferred_language: str
    is_active: bool