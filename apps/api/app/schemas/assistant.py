from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class AssistantConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1000)

    @field_validator("content")
    @classmethod
    def clean_content(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Message content cannot be empty.")

        return value


class AssistantChatRequest(BaseModel):
    context: Literal["home", "tracking"]
    message: str = Field(min_length=1, max_length=1500)

    tracking_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    conversation_history: list[AssistantConversationMessage] = Field(
        default_factory=list,
        max_length=8,
    )

    @field_validator("message")
    @classmethod
    def clean_message(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Message cannot be empty.")

        return value

    @field_validator("tracking_number")
    @classmethod
    def clean_tracking_number(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()

        if not value:
            raise ValueError("Tracking number cannot be empty.")

        return value

    @model_validator(mode="after")
    def validate_context(self):
        if self.context == "tracking" and not self.tracking_number:
            raise ValueError(
                "A tracking number is required for tracking assistance."
            )

        if self.context == "home" and self.tracking_number:
            raise ValueError(
                "Homepage assistance must not include a tracking number."
            )

        return self


class AssistantChatResponse(BaseModel):
    reply: str