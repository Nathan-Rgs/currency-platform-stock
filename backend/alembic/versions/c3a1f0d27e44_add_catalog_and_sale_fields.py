"""add catalog and sale fields to coin

Revision ID: c3a1f0d27e44
Revises: 5a981e30d080
Create Date: 2026-10-21 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3a1f0d27e44'
down_revision: Union[str, Sequence[str], None] = '5a981e30d080'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('coins', schema=None) as batch_op:
        batch_op.add_column(sa.Column('for_sale', sa.Boolean(), server_default=sa.false(), nullable=False))
        batch_op.add_column(sa.Column('sale_price', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('public_description', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('catalog_ref', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('material', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('diameter_mm', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('weight_g', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('mint_mark', sa.String(length=50), nullable=True))
        batch_op.create_index(batch_op.f('ix_coins_for_sale'), ['for_sale'], unique=False)
        batch_op.create_index(batch_op.f('ix_coins_catalog_ref'), ['catalog_ref'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('coins', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_coins_catalog_ref'))
        batch_op.drop_index(batch_op.f('ix_coins_for_sale'))
        batch_op.drop_column('mint_mark')
        batch_op.drop_column('weight_g')
        batch_op.drop_column('diameter_mm')
        batch_op.drop_column('material')
        batch_op.drop_column('catalog_ref')
        batch_op.drop_column('public_description')
        batch_op.drop_column('sale_price')
        batch_op.drop_column('for_sale')
