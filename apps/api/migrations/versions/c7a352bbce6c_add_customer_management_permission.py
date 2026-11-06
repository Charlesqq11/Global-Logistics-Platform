"""add customer management permission

Revision ID: c7a352bbce6c
Revises: 61e91d78b99b
"""

from datetime import datetime, timezone
from uuid import uuid4

import sqlalchemy as sa
from alembic import op


revision = "c7a352bbce6c"
down_revision = "61e91d78b99b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()

    permissions = sa.table(
        "permissions",
        sa.column("id", sa.Uuid()),
        sa.column("name", sa.String()),
        sa.column("description", sa.String()),
        sa.column("created_at", sa.DateTime(timezone=True)),
    )

    roles = sa.table(
        "roles",
        sa.column("id", sa.Uuid()),
        sa.column("name", sa.String()),
    )

    role_permissions = sa.table(
        "role_permissions",
        sa.column("role_id", sa.Uuid()),
        sa.column("permission_id", sa.Uuid()),
    )

    permission_id = connection.execute(
        sa.select(permissions.c.id).where(
            permissions.c.name == "customers.manage"
        )
    ).scalar_one_or_none()

    if permission_id is None:
        permission_id = uuid4()

        connection.execute(
            permissions.insert().values(
                id=permission_id,
                name="customers.manage",
                description=(
                    "Create and manage customer accounts "
                    "and customer staff access."
                ),
                created_at=datetime.now(timezone.utc),
            )
        )

    admin_role_id = connection.execute(
        sa.select(roles.c.id).where(
            roles.c.name == "SUPER_ADMIN"
        )
    ).scalar_one_or_none()

    if admin_role_id is None:
        raise RuntimeError(
            "SUPER_ADMIN role was not found."
        )

    existing_assignment = connection.execute(
        sa.select(role_permissions.c.role_id).where(
            role_permissions.c.role_id == admin_role_id,
            role_permissions.c.permission_id == permission_id,
        )
    ).first()

    if existing_assignment is None:
        connection.execute(
            role_permissions.insert().values(
                role_id=admin_role_id,
                permission_id=permission_id,
            )
        )


def downgrade() -> None:
    connection = op.get_bind()

    permissions = sa.table(
        "permissions",
        sa.column("id", sa.Uuid()),
        sa.column("name", sa.String()),
    )

    role_permissions = sa.table(
        "role_permissions",
        sa.column("role_id", sa.Uuid()),
        sa.column("permission_id", sa.Uuid()),
    )

    permission_id = connection.execute(
        sa.select(permissions.c.id).where(
            permissions.c.name == "customers.manage"
        )
    ).scalar_one_or_none()

    if permission_id is not None:
        connection.execute(
            role_permissions.delete().where(
                role_permissions.c.permission_id == permission_id
            )
        )

        connection.execute(
            permissions.delete().where(
                permissions.c.id == permission_id
            )
        )