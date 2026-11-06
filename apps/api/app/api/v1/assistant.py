from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rate_limit import enforce_rate_limit
from app.schemas.assistant import (
    AssistantChatRequest,
    AssistantChatResponse,
)
from app.services.assistant import generate_assistant_reply
from app.services.tracking import get_public_tracking


router = APIRouter(
    prefix="/assistant",
    tags=["AI Customer Assistant"],
)


@router.post(
    "/chat",
    response_model=AssistantChatResponse,
)
async def assistant_chat(
    payload: AssistantChatRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> AssistantChatResponse:

    scope = f"assistant:{payload.context}"

    # Maximum 10 requests per minute.
    await enforce_rate_limit(
        request,
        scope=f"{scope}:minute",
        maximum=10,
        window_seconds=60,
    )

    # Maximum 100 requests per day.
    await enforce_rate_limit(
        request,
        scope=f"{scope}:day",
        maximum=100,
        window_seconds=86400,
    )

    shipment = None

    if payload.context == "tracking":
        shipment = get_public_tracking(
            db=db,
            tracking_number=payload.tracking_number,
        )

        if shipment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shipment not found.",
            )

    try:
        reply = await generate_assistant_reply(
            context=payload.context,
            message=payload.message,
            conversation_history=payload.conversation_history,
            shipment=shipment,
        )

        return AssistantChatResponse(reply=reply)

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "The assistant is temporarily unavailable. "
                "Please try again shortly."
            ),
        ) from None