"""enforce single supplier account

Revision ID: cc8d986f4c99
Revises: 7fdc38760ff6
Create Date: 2026-11-23 14:24:56.758003

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cc8d986f4c99'
down_revision: Union[str, Sequence[str], None] = '7fdc38760ff6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "uq_users_single_supplier",
        "users",
        ["role"],
        unique=True,
        postgresql_where=sa.text("role = 'SUPPLIER'")
    )


def downgrade() -> None:
    op.drop_index(
        "uq_users_single_supplier",
        table_name="users"
    )