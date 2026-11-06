from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.core.auth import require_permission
from app.core.database import get_db
from app.models.access import User
from app.models.visitor_analytics import TrackingVisit


router = APIRouter(
    prefix="/admin/analytics",
    tags=["Admin Visitor Analytics"],
)


def _date_filter(days: int):
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    return TrackingVisit.visited_at >= start_date


@router.get("/overview")
def get_analytics_overview(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("analytics.view")
    ),
):
    date_condition = _date_filter(days)

    total_visits = db.scalar(
        select(func.count(TrackingVisit.id)).where(
            date_condition
        )
    ) or 0

    unique_visitors = db.scalar(
        select(
            func.count(
                distinct(TrackingVisit.visitor_hash)
            )
        ).where(
            date_condition,
            TrackingVisit.visitor_hash.is_not(None),
        )
    ) or 0

    countries_reached = db.scalar(
        select(
            func.count(
                distinct(TrackingVisit.country_code)
            )
        ).where(
            date_condition,
            TrackingVisit.country_code.is_not(None),
        )
    ) or 0

    cities_reached = db.scalar(
        select(
            func.count(
                distinct(TrackingVisit.city)
            )
        ).where(
            date_condition,
            TrackingVisit.city.is_not(None),
        )
    ) or 0

    device_rows = db.execute(
        select(
            TrackingVisit.device_type,
            func.count(TrackingVisit.id).label("visits"),
        )
        .where(date_condition)
        .group_by(TrackingVisit.device_type)
        .order_by(func.count(TrackingVisit.id).desc())
    ).all()

    browser_rows = db.execute(
        select(
            TrackingVisit.browser,
            func.count(TrackingVisit.id).label("visits"),
        )
        .where(date_condition)
        .group_by(TrackingVisit.browser)
        .order_by(func.count(TrackingVisit.id).desc())
    ).all()

    country_rows = db.execute(
        select(
            TrackingVisit.country,
            TrackingVisit.country_code,
            func.count(TrackingVisit.id).label("visits"),
        )
        .where(
            date_condition,
            TrackingVisit.country_code.is_not(None),
        )
        .group_by(
            TrackingVisit.country,
            TrackingVisit.country_code,
        )
        .order_by(func.count(TrackingVisit.id).desc())
        .limit(20)
    ).all()

    return {
        "period_days": days,
        "total_visits": total_visits,
        "unique_visitors": unique_visitors,
        "countries_reached": countries_reached,
        "cities_reached": cities_reached,
        "devices": [
            {
                "device": row.device_type or "Unknown",
                "visits": row.visits,
            }
            for row in device_rows
        ],
        "browsers": [
            {
                "browser": row.browser or "Unknown",
                "visits": row.visits,
            }
            for row in browser_rows
        ],
        "countries": [
            {
                "country": row.country or "Unknown",
                "country_code": row.country_code,
                "visits": row.visits,
            }
            for row in country_rows
        ],
    }


@router.get("/visits")
def get_analytics_visits(
    days: int = Query(default=30, ge=1, le=365),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("analytics.view")
    ),
):
    date_condition = _date_filter(days)

    total = db.scalar(
        select(func.count(TrackingVisit.id)).where(
            date_condition
        )
    ) or 0

    statement = (
        select(TrackingVisit)
        .where(date_condition)
        .order_by(TrackingVisit.visited_at.desc())
        .offset(offset)
        .limit(limit)
    )

    visits = db.scalars(statement).all()

    return {
        "period_days": days,
        "total": total,
        "limit": limit,
        "offset": offset,
        "visits": [
            {
                "id": str(visit.id),
                "tracking_number": visit.tracking_number,
                "ip_address": visit.ip_address,
                "country": visit.country,
                "country_code": visit.country_code,
                "region": visit.region,
                "city": visit.city,
                "timezone": visit.timezone_name,
                "browser": visit.browser,
                "operating_system": visit.operating_system,
                "device_type": visit.device_type,
                "visited_at": visit.visited_at,
            }
            for visit in visits
        ],
    }