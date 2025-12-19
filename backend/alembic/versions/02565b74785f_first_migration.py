"""first migration

Revision ID: 02565b74785f
Revises: 
Create Date: 2025-11-25 23:29:38.961602

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "02565b74785f"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("display_name", sa.String(100), nullable=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_table(
        "coins",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("country", sa.String(100), nullable=False),
        sa.Column("face_value", sa.String(100), nullable=False),
        sa.Column("purchase_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("estimated_value", sa.Numeric(10, 2), nullable=True),
        sa.Column(
            "originality",
            sa.String(50),
            nullable=False,
            server_default="original",  # casa com OriginalityEnum.original
        ),
        sa.Column("condition", sa.String(100), nullable=True),
        sa.Column("storage_location", sa.String(255), nullable=True),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("acquisition_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("acquisition_source", sa.String(100), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("image_url_front", sa.String(255), nullable=True),
        sa.Column("image_url_back", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("coins")
    op.drop_table("users")
