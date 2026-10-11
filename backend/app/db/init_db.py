"""Database initialization and health verification utility."""

import logging
from sqlalchemy import text
from app.db.session import engine, Base
from app.db.base import *  # noqa: F401, F403

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("stockiq.db.init")


def init_db() -> None:
    """Initialize database extensions and verify schema readiness."""
    logger.info("Connecting to database: %s", engine.url.render_as_string(hide_password=True))
    
    with engine.connect() as conn:
        # Check connection
        res = conn.execute(text("SELECT 1")).scalar()
        logger.info("Database connection test succeeded (SELECT 1 -> %s)", res)

        # Attempt to enable extensions on PostgreSQL
        if engine.dialect.name == "postgresql":
            logger.info("Ensuring PostgreSQL extensions 'uuid-ossp' and 'vector' exist...")
            conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()
            logger.info("PostgreSQL extensions configured successfully.")

        # Create all tables if not using Alembic migrations
        logger.info("Verifying tables registered in metadata (%d tables)", len(Base.metadata.tables))
        Base.metadata.create_all(bind=conn)
        conn.commit()
        logger.info("Database schema initialized successfully.")


if __name__ == "__main__":
    init_db()
