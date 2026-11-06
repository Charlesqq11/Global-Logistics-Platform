import logging

from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.config import settings


logger = logging.getLogger(__name__)

redis_client: Redis | None = None


async def connect_redis() -> bool:
    """
    Establish and verify the shared Redis connection.
    The main application remains available if Redis is temporarily offline.
    """

    global redis_client

    client = Redis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
        socket_connect_timeout=3,
        socket_timeout=3,
        health_check_interval=30,
    )

    try:
        await client.ping()
        redis_client = client

        logger.info("Redis connection established successfully.")

        return True

    except RedisError:
        logger.exception("Redis connection failed.")

        await client.aclose()
        redis_client = None

        return False


async def close_redis() -> None:
    """Close the shared Redis connection during application shutdown."""

    global redis_client

    if redis_client is not None:
        await redis_client.aclose()
        redis_client = None

        logger.info("Redis connection closed.")


def get_redis_client() -> Redis | None:
    """Return the shared Redis client, if available."""

    return redis_client