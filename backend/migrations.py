"""Tiny schema migrator.

`db.create_all()` creates missing *tables* but never adds new *columns* to an
existing table, which breaks older SQLite files after a model change. This
helper adds any missing columns so upgrades need no manual steps. For larger
projects, switch to Flask-Migrate/Alembic.
"""
import logging

from sqlalchemy import inspect, text

from extensions import db

logger = logging.getLogger("edupredict")


def _default_sql(column):
    default = column.default
    if default is None or not getattr(default, "is_scalar", False):
        return ""
    value = default.arg
    if isinstance(value, bool):
        return f" DEFAULT {int(value)}"
    if isinstance(value, (int, float)):
        return f" DEFAULT {value}"
    if isinstance(value, str):
        return " DEFAULT '" + value.replace("'", "''") + "'"
    return ""


def ensure_schema():
    """Create missing tables, then add missing columns. Returns the list added."""
    db.create_all()
    engine = db.engine
    inspector = inspect(engine)
    added = []
    for table in db.metadata.sorted_tables:
        existing = {c["name"] for c in inspector.get_columns(table.name)}
        for column in table.columns:
            if column.name in existing:
                continue
            ddl_type = column.type.compile(dialect=engine.dialect)
            sql = f'ALTER TABLE "{table.name}" ADD COLUMN "{column.name}" {ddl_type}{_default_sql(column)}'
            with engine.begin() as conn:
                conn.execute(text(sql))
            added.append(f"{table.name}.{column.name}")
            logger.info("Migrated: added %s.%s", table.name, column.name)
    return added
