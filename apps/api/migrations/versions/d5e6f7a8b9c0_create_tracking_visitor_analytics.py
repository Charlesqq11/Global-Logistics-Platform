"""create tracking visitor analytics

Revision ID: d5e6f7a8b9c0
Revises: d4e5f6a7b8c9
"""

from datetime import datetime, timezone
from uuid import uuid4

import sqlalchemy as sa
from alembic import op


revision = "d5e6f7a8b9c0"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tracking_visits",

        sa.Column(
            "id",
            sa.Uuid(),
            primary_key=True,
            nullable=False,
        ),

        sa.Column(
            "shipment_id",
            sa.Uuid(),
            sa.ForeignKey(
                "shipments.id",
                ondelete="SET NULL",
            ),
            nullable=True,
        ),

        sa.Column(
            "tracking_number",
            sa.String(100),
            nullable=False,
        ),

        sa.Column(
            "ip_address",
            sa.String(45),
            nullable=True,
        ),

        sa.Column(
            "country",
            sa.String(100),
            nullable=True,
        ),

        sa.Column(
            "country_code",
            sa.String(2),
            nullable=True,
        ),

        sa.Column(
            "region",
            sa.String(150),
            nullable=True,
        ),

        sa.Column(
            "city",
            sa.String(150),
            nullable=True,
        ),

        sa.Column(
            "timezone_name",
            sa.String(100),
            nullable=True,
        ),

        sa.Column(
            "user_agent",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "browser",
            sa.String(100),
            nullable=True,
        ),

        sa.Column(
            "operating_system",
            sa.String(100),
            nullable=True,
        ),

        sa.Column(
            "device_type",
            sa.String(50),
            nullable=True,
        ),

        sa.Column(
            "visitor_hash",
            sa.String(64),
            nullable=True,
        ),

        sa.Column(
            "visited_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_index(
        "ix_tracking_visits_shipment_id",
        "tracking_visits",
        ["shipment_id"],
    )

    op.create_index(
        "ix_tracking_visits_tracking_number",
        "tracking_visits",
        ["tracking_number"],
    )

    op.create_index(
        "ix_tracking_visits_country_code",
        "tracking_visits",
        ["country_code"],
    )

    op.create_index(
        "ix_tracking_visits_city",
        "tracking_visits",
        ["city"],
    )

    op.create_index(
        "ix_tracking_visits_visitor_hash",
        "tracking_visits",
        ["visitor_hash"],
    )

    op.create_index(
        "ix_tracking_visits_visited_at",
        "tracking_visits",
        ["visited_at"],
    )

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
        raise RuntimeError("SUPER_ADMIN role was not found.")

    permission_id = connection.execute(
        sa.select(permissions.c.id).where(
            permissions.c.name == "analytics.view"
        )
    ).scalar_one_or_none()

    if permission_id is None:
        permission_id = uuid4()

        connection.execute(
            permissions.insert().values(
                id=permission_id,
                name="analytics.view",
                description="View tracking visitor analytics.",
                created_at=datetime.now(timezone.utc),
            )
        )

    assignment_exists = connection.execute(
        sa.select(role_permissions.c.role_id).where(
            role_permissions.c.role_id == admin_role_id,
            role_permissions.c.permission_id == permission_id,
        )
    ).first()

    if assignment_exists is None:
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
        sa.column("permission_id", sa.Uuid()),
    )

    permission_ids = connection.execute(
        sa.select(permissions.c.id).where(
            permissions.c.name == "analytics.view"
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

    op.drop_index(
        "ix_tracking_visits_visited_at",
        table_name="tracking_visits",
    )

    op.drop_index(
        "ix_tracking_visits_visitor_hash",
        table_name="tracking_visits",
    )

    op.drop_index(
        "ix_tracking_visits_city",
        table_name="tracking_visits",
    )

    op.drop_index(
        "ix_tracking_visits_country_code",
        table_name="tracking_visits",
    )

    op.drop_index(
        "ix_tracking_visits_tracking_number",
        table_name="tracking_visits",
    )

    op.drop_index(
        "ix_tracking_visits_shipment_id",
        table_name="tracking_visits",
    )

    op.drop_table("tracking_visits")