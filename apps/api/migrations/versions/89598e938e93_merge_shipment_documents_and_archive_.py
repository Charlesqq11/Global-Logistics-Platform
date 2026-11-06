"""merge shipment documents and archive migrations

Revision ID: 89598e938e93
Revises: 6b82a0ce90aa, b7c4e91d2f63
Create Date: 2026-10-02 15:33:25.530558

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '89598e938e93'
down_revision: Union[str, Sequence[str], None] = ('6b82a0ce90aa', 'b7c4e91d2f63')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
