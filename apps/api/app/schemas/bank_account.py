from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BankAccountCreate(BaseModel):
    bank_name: str = Field(min_length=1, max_length=150)
    account_name: str = Field(min_length=1, max_length=255)
    account_number: str = Field(min_length=1, max_length=50)
    currency: str = Field(min_length=3, max_length=3)

    country: str | None = Field(default=None, max_length=100)
    bank_code: str | None = Field(default=None, max_length=50)
    swift_code: str | None = Field(default=None, max_length=20)
    iban: str | None = Field(default=None, max_length=34)
    transfer_instructions: str | None = None
    is_active: bool = True

    @field_validator(
        "bank_name",
        "account_name",
        "account_number",
        mode="before",
    )
    @classmethod
    def strip_required_text(cls, value):
        if isinstance(value, str):
            value = value.strip()
        return value

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        value = value.strip().upper()
        if len(value) != 3 or not value.isalpha():
            raise ValueError("Currency must be a valid three-letter code.")
        return value


class BankAccountUpdate(BaseModel):
    bank_name: str | None = Field(default=None, min_length=1, max_length=150)
    account_name: str | None = Field(default=None, min_length=1, max_length=255)
    account_number: str | None = Field(default=None, min_length=1, max_length=50)
    currency: str | None = Field(default=None, min_length=3, max_length=3)

    country: str | None = Field(default=None, max_length=100)
    bank_code: str | None = Field(default=None, max_length=50)
    swift_code: str | None = Field(default=None, max_length=20)
    iban: str | None = Field(default=None, max_length=34)
    transfer_instructions: str | None = None
    is_active: bool | None = None

    @field_validator(
        "bank_name",
        "account_name",
        "account_number",
        mode="before",
    )
    @classmethod
    def strip_required_text(cls, value):
        if isinstance(value, str):
            value = value.strip()
        return value

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str | None) -> str | None:
        if value is None:
            return value

        value = value.strip().upper()
        if len(value) != 3 or not value.isalpha():
            raise ValueError("Currency must be a valid three-letter code.")
        return value


class BankAccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    bank_name: str
    account_name: str
    account_number: str
    currency: str
    country: str | None
    bank_code: str | None
    swift_code: str | None
    iban: str | None
    transfer_instructions: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
