# Global Logistics Platform

Professional international logistics, shipment tracking, customs, payment, notification, and operations platform.

## Architecture

- Next.js frontend
- FastAPI backend
- PostgreSQL database
- SQLAlchemy ORM
- Alembic migrations
- Redis for background processing
- Docker-based deployment

## Applications

- `apps/web` — Customer and administrative frontend
- `apps/api` — Backend API

## Project Documentation

- `docs/architecture` — System architecture
- `docs/api` — API documentation
- `docs/database` — Database documentation
- `docs/operations` — Operational documentation

## Development

Development, staging, and production environments are maintained separately.

Never commit secrets or production credentials to Git.