from __future__ import annotations

import hashlib
import hmac
import ipaddress
import json
import logging
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from threading import Lock

from fastapi import Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.shipment import Shipment
from app.models.visitor_analytics import TrackingVisit


logger = logging.getLogger(__name__)

GEO_CACHE_TTL = 86400
GEO_CACHE_MAX_SIZE = 2048

_geo_cache: dict[str, tuple[float, dict]] = {}
_geo_cache_lock = Lock()


def _get_client_ip(request: Request) -> str | None:
    if request.client is None:
        return None

    try:
        return str(ipaddress.ip_address(request.client.host))
    except ValueError:
        return None


def _lookup_ip_location(ip_address: str | None) -> dict | None:
    if not ip_address:
        return None

    try:
        parsed_ip = ipaddress.ip_address(ip_address)

        # Never send local, private or reserved IP addresses
        # to an external geolocation provider.
        if not parsed_ip.is_global:
            return None

        now = time.monotonic()

        with _geo_cache_lock:
            cached = _geo_cache.get(ip_address)

            if cached and now - cached[0] < GEO_CACHE_TTL:
                return cached[1]

        url = f"https://ipapi.co/{ip_address}/json/"

        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "GlobalLogisticsPlatform/1.0",
                "Accept": "application/json",
            },
        )

        with urllib.request.urlopen(req, timeout=3) as response:
            if response.status != 200:
                return None

            data = json.loads(response.read(16384).decode("utf-8"))

        if not isinstance(data, dict) or data.get("error"):
            return None

        location = {
            "country": str(data.get("country_name") or "")[:100] or None,
            "country_code": str(data.get("country_code") or "")[:2] or None,
            "region": str(data.get("region") or "")[:150] or None,
            "city": str(data.get("city") or "")[:150] or None,
            "timezone": str(data.get("timezone") or "")[:100] or None,
        }

        with _geo_cache_lock:
            if len(_geo_cache) >= GEO_CACHE_MAX_SIZE:
                _geo_cache.clear()

            _geo_cache[ip_address] = (now, location)

        return location

    except (
        ValueError,
        OSError,
        urllib.error.URLError,
        TimeoutError,
        json.JSONDecodeError,
    ):
        logger.warning("IP geolocation lookup failed.")
        return None


def _get_browser(user_agent: str) -> str:
    ua = user_agent.lower()

    if "edg/" in ua:
        return "Microsoft Edge"
    if "opr/" in ua or "opera" in ua:
        return "Opera"
    if "chrome/" in ua and "chromium" not in ua:
        return "Google Chrome"
    if "firefox/" in ua:
        return "Mozilla Firefox"
    if "safari/" in ua and "chrome/" not in ua:
        return "Safari"

    return "Unknown"


def _get_operating_system(user_agent: str) -> str:
    ua = user_agent.lower()

    if "windows" in ua:
        return "Windows"
    if "iphone" in ua or "ipad" in ua or "ios" in ua:
        return "iOS"
    if "android" in ua:
        return "Android"
    if "mac os" in ua or "macintosh" in ua:
        return "macOS"
    if "linux" in ua:
        return "Linux"

    return "Unknown"


def _get_device_type(user_agent: str) -> str:
    ua = user_agent.lower()

    if "ipad" in ua or "tablet" in ua:
        return "Tablet"
    if "mobile" in ua or "iphone" in ua or "android" in ua:
        return "Mobile"

    return "Desktop"


def _get_visitor_hash(
    ip_address: str | None,
    user_agent: str,
) -> str | None:
    if not ip_address or not settings.secret_key:
        return None

    visitor_data = f"{ip_address}|{user_agent}".encode("utf-8")

    return hmac.new(
        settings.secret_key.encode("utf-8"),
        visitor_data,
        hashlib.sha256,
    ).hexdigest()


def record_tracking_visit(
    db: Session,
    request: Request,
    shipment: Shipment,
) -> None:
    try:
        user_agent = request.headers.get("user-agent", "")[:2000]
        ip_address = _get_client_ip(request)

        location = _lookup_ip_location(ip_address) or {}

        visit = TrackingVisit(
            shipment_id=shipment.id,
            tracking_number=shipment.tracking_number,
            ip_address=ip_address,
            country=location.get("country"),
            country_code=location.get("country_code"),
            region=location.get("region"),
            city=location.get("city"),
            timezone_name=location.get("timezone"),
            user_agent=user_agent or None,
            browser=_get_browser(user_agent),
            operating_system=_get_operating_system(user_agent),
            device_type=_get_device_type(user_agent),
            visitor_hash=_get_visitor_hash(ip_address, user_agent),
            visited_at=datetime.now(timezone.utc),
        )

        db.add(visit)
        db.commit()

    except Exception:
        db.rollback()
        logger.exception("Unable to record tracking visitor analytics.")