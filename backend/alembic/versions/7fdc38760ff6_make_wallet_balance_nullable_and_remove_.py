"""make wallet balance nullable and remove default

Revision ID: 7fdc38760ff6
Revises: beb5775619bd
Create Date: 2026-11-18 13:03:06.758175

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7fdc38760ff6'
down_revision: Union[str, Sequence[str], None] = 'beb5775619bd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'users',
        'wallet_balance',
        existing_type=sa.Numeric(precision=10, scale=2),
        nullable=True,
        server_default=None
    )

def downgrade() -> None:
    op.execute(
        "UPDATE users SET wallet_balance = 1000.00 "
        "WHERE wallet_balance IS NULL"
    )

    op.alter_column(
        'users',
        'wallet_balance',
        existing_type=sa.Numeric(precision=10, scale=2),
        nullable=False,
        server_default=sa.text('1000.00')
    )
