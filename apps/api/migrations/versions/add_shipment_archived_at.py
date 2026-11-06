from alembic import op
import sqlalchemy as sa


revision = "b7c4e91d2f63"
down_revision = "8a7f4d522c37"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "shipments",
        sa.Column(
            "archived_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_shipments_archived_at",
        "shipments",
        ["archived_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_shipments_archived_at",
        table_name="shipments",
    )

    op.drop_column(
        "shipments",
        "archived_at",
    )