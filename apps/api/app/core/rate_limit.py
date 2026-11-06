import hashlib
import math
import secrets
import time

from fastapi import HTTPException, Request, status
from redis.exceptions import RedisError

from app.core.config import settings
from app.core.redis import get_redis_client


SLIDING_WINDOW_SCRIPT = """
local key = KEYS[1]
local window_ms = tonumber(ARGV[1])
local maximum = tonumber(ARGV[2])
local member = ARGV[3]

local redis_time = redis.call('TIME')
local now_ms = (tonumber(redis_time[1]) * 1000)
    + math.floor(tonumber(redis_time[2]) / 1000)

local window_start = now_ms - window_ms

redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

local count = redis.call('ZCARD', key)

if count >= maximum then
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local retry_ms = window_ms

    if oldest[2] then
        retry_ms = math.max(
            1,
            tonumber(oldest[2]) + window_ms - now_ms
        )
    end

    return {0, retry_ms, count}
end

redis.call('ZADD', key, now_ms, member)
redis.call('PEXPIRE', key, window_ms)

return {1, 0, count + 1}
"""


async def enforce_rate_limit(
    request: Request,
    *,
    scope: str,
    maximum: int,
    window_seconds: int,
) -> None:
    """
    Enforce an atomic Redis-backed sliding-window rate limit.

    Client addresses are hashed before being used in Redis keys.
    Raw IP addresses are never stored in the rate-limit keys.
    """

    if maximum < 1 or window_seconds < 1:
        raise ValueError("Rate-limit values must be positive.")

    redis_client = get_redis_client()

    if redis_client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The assistant is temporarily unavailable. Please try again shortly.",
            headers={"Retry-After": "10"},
        )

    client_ip = (
        request.client.host
        if request.client is not None
        else "unknown"
    )

    identity = hashlib.sha256(
        f"{settings.secret_key}:{client_ip}".encode("utf-8")
    ).hexdigest()

    redis_key = f"ai-rate-limit:{scope}:{identity}"

    try:
        result = await redis_client.eval(
            SLIDING_WINDOW_SCRIPT,
            1,
            redis_key,
            window_seconds * 1000,
            maximum,
            secrets.token_hex(16),
        )

    except RedisError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The assistant is temporarily unavailable. Please try again shortly.",
            headers={"Retry-After": "10"},
        ) from None

    allowed = int(result[0])
    retry_ms = int(result[1])

    if not allowed:
        retry_seconds = max(1, math.ceil(retry_ms / 1000))

        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="You've reached the assistant request limit. Please try again shortly.",
            headers={"Retry-After": str(retry_seconds)},
        )