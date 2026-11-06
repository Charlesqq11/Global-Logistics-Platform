"""add admin operational permissions

Revision ID: d4e5f6a7b8c9
Revises: c7a352bbce6c
"""

from datetime import datetime, timezone
from uuid import uuid4

import sqlalchemy as sa
from alembic import op


revision = "d4e5f6a7b8c9"
down_revision = "c7a352bbce6c"
branch_labels = None
depends_on = None


ADMIN_PERMISSIONS = {
    "shipments.create": "Create and update shipment records.",
    "shipments.read": "View and retrieve shipment records.",
    "tracking.manage": "Manage shipment tracking events and statuses.",
    "documents.manage": "Upload, view, download and delete shipment documents.",
}


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

    admin_role_id = connection.execute(
        sa.select(roles.c.id).where(
            roles.c.name == "SUPER_ADMIN"
        )
    ).scalar_one_or_none()

    if admin_role_id is None:
        admin_role_id = uuid4()
        connection.execute(
            sa.text(
                "INSERT INTO roles (id, name, description, is_active, created_at) "
                "VALUES (:id, 'SUPER_ADMIN', 'Full administrative access.', true, :now)"
            ),
            {"id": admin_role_id, "now": datetime.now(timezone.utc)},
        )

    for name, description in ADMIN_PERMISSIONS.items():

        permission_id = connection.execute(
            sa.select(permissions.c.id).where(
                permissions.c.name == name
            )
        ).scalar_one_or_none()

        if permission_id is None:
            permission_id = uuid4()

            connection.execute(
                permissions.insert().values(
                    id=permission_id,
                    name=name,
                    description=description,
                    created_at=datetime.now(timezone.utc),
                )
            )

        existing = connection.execute(
            sa.select(role_permissions.c.role_id).where(
                role_permissions.c.role_id == admin_role_id,
                role_permissions.c.permission_id == permission_id,
            )
        ).first()

        if existing is None:
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

    permission_ids = connection.execute(
        sa.select(permissions.c.id).where(
            permissions.c.name.in_(list(ADMIN_PERMISSIONS))
        )
    ).scalars().all()

    if permission_ids:
        connection.execute(
            role_permissions.delete().where(
                role_permissions.c.permission_id.in_(permission_ids)
            )
        )

        connection.execute(
            permissions.delete().where(
                permissions.c.id.in_(permission_ids)
            )
        )