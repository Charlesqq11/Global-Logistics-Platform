"""prevent duplicate active payment proofs

Revision ID: e7f8a9b0c1d2
Revises: d8868828cf05
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e7f8a9b0c1d2"
down_revision: Union[str, Sequence[str], None] = "d8868828cf05"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "uq_payment_proofs_one_submitted_per_request",
        "payment_proofs",
        ["payment_request_id"],
        unique=True,
        postgresql_where=sa.text("status = 'submitted'"),
        sqlite_where=sa.text("status = 'submitted'"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_payment_proofs_one_submitted_per_request",
        table_name="payment_proofs",
    )
