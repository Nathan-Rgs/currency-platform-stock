"""update_models_to_sqlalchemy_2_syntax

Revision ID: 3647e399b1cc
Revises: 02565b74785f
Create Date: 2025-12-17 23:15:58.205140

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3647e399b1cc'
down_revision: Union[str, Sequence[str], None] = '02565b74785f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Define o novo tipo ENUM
new_originality_enum = postgresql.ENUM(
    'ORIGINAL', 'REPLICA', 'UNKNOWN', name='originalityenum'
)
old_originality_enum = postgresql.ENUM(
    'original', 'replica', 'unknown', name='originalityenum'
)

def upgrade() -> None:
    """Upgrade schema."""
    # ### Manually handle the ENUM column with defaults ###
    op.execute('ALTER TABLE coins ALTER COLUMN originality DROP DEFAULT;')
    new_originality_enum.create(op.get_bind(), checkfirst=False) # create the new type
    op.execute(
        "ALTER TABLE coins ALTER COLUMN originality TYPE originalityenum "
        "USING UPPER(originality)::originalityenum"
    )
    op.execute("ALTER TABLE coins ALTER COLUMN originality SET DEFAULT 'ORIGINAL'")
    # ### End of manual handling ###

    with op.batch_alter_table('coins', schema=None) as batch_op:
        batch_op.alter_column('purchase_price',
               existing_type=sa.NUMERIC(precision=10, scale=2),
               type_=sa.Float(),
               existing_nullable=True)
        batch_op.alter_column('estimated_value',
               existing_type=sa.NUMERIC(precision=10, scale=2),
               type_=sa.Float(),
               existing_nullable=True)
        batch_op.alter_column('storage_location',
               existing_type=sa.VARCHAR(length=255),
               type_=sa.String(length=200),
               existing_nullable=True)
        batch_op.alter_column('acquisition_date',
               existing_type=postgresql.TIMESTAMP(timezone=True),
               type_=sa.DateTime(),
               existing_nullable=True)
        batch_op.alter_column('acquisition_source',
               existing_type=sa.VARCHAR(length=100),
               type_=sa.String(length=200),
               existing_nullable=True)
        batch_op.alter_column('image_url_front',
               existing_type=sa.VARCHAR(length=255),
               type_=sa.String(length=500),
               existing_nullable=True)
        batch_op.alter_column('image_url_back',
               existing_type=sa.VARCHAR(length=255),
               type_=sa.String(length=500),
               existing_nullable=True)
        batch_op.create_index(batch_op.f('ix_coins_category'), ['category'], unique=False)
        batch_op.create_index(batch_op.f('ix_coins_condition'), ['condition'], unique=False)
        batch_op.create_index(batch_op.f('ix_coins_country'), ['country'], unique=False)
        batch_op.create_index(batch_op.f('ix_coins_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_coins_originality'), ['originality'], unique=False)
        batch_op.create_index(batch_op.f('ix_coins_owner_id'), ['owner_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_coins_year'), ['year'], unique=False)
        batch_op.drop_constraint('coins_owner_id_fkey', type_='foreignkey')
        batch_op.create_foreign_key(batch_op.f('fk_coins_owner_id_users'), 'users', ['owner_id'], ['id'], ondelete='CASCADE')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('email',
               existing_type=sa.VARCHAR(length=255),
               type_=sa.String(length=320),
               existing_nullable=False)
        batch_op.drop_constraint('users_email_key', type_='unique')
        batch_op.create_index(batch_op.f('ix_users_email'), ['email'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    # ### Manually handle the ENUM column downgrade ###
    op.execute('ALTER TABLE coins ALTER COLUMN originality DROP DEFAULT;')
    op.execute("ALTER TABLE coins ALTER COLUMN originality TYPE VARCHAR(50) USING originality::text;")
    op.execute("ALTER TABLE coins ALTER COLUMN originality SET DEFAULT 'original';")
    new_originality_enum.drop(op.get_bind(), checkfirst=True)
    # ### End of manual handling ###

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_email'))
        batch_op.create_unique_constraint('users_email_key', ['email'], postgresql_nulls_not_distinct=False)
        batch_op.alter_column('email',
               existing_type=sa.String(length=320),
               type_=sa.VARCHAR(length=255),
               existing_nullable=False)

    with op.batch_alter_table('coins', schema=None) as batch_op:
        batch_op.drop_constraint(batch_op.f('fk_coins_owner_id_users'), type_='foreignkey')
        batch_op.create_foreign_key('coins_owner_id_fkey', 'users', ['owner_id'], ['id'])
        batch_op.drop_index(batch_op.f('ix_coins_year'))
        batch_op.drop_index(batch_op.f('ix_coins_owner_id'))
        batch_op.drop_index(batch_op.f('ix_coins_originality'))
        batch_op.drop_index(batch_op.f('ix_coins_id'))
        batch_op.drop_index(batch_op.f('ix_coins_country'))
        batch_op.drop_index(batch_op.f('ix_coins_condition'))
        batch_op.drop_index(batch_op.f('ix_coins_category'))
        batch_op.alter_column('image_url_back',
               existing_type=sa.String(length=500),
               type_=sa.VARCHAR(length=255),
               existing_nullable=True)
        batch_op.alter_column('image_url_front',
               existing_type=sa.String(length=500),
               type_=sa.VARCHAR(length=255),
               existing_nullable=True)
        batch_op.alter_column('acquisition_source',
               existing_type=sa.String(length=200),
               type_=sa.VARCHAR(length=100),
               existing_nullable=True)
        batch_op.alter_column('acquisition_date',
               existing_type=sa.DateTime(),
               type_=postgresql.TIMESTAMP(timezone=True),
               existing_nullable=True)
        batch_op.alter_column('storage_location',
               existing_type=sa.String(length=200),
               type_=sa.VARCHAR(length=255),
               existing_nullable=True)
        batch_op.alter_column('estimated_value',
               existing_type=sa.Float(),
               type_=sa.NUMERIC(precision=10, scale=2),
               existing_nullable=True)
        batch_op.alter_column('purchase_price',
               existing_type=sa.Float(),
               type_=sa.NUMERIC(precision=10, scale=2),
               existing_nullable=True)
