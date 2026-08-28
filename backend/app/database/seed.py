import logging
from backend.app.database.database import engine, Base
from backend.app.models.diagnosis import DiagnosisRecord

logger = logging.getLogger("plantguard.seed")

def init_db():
    """Initializes database tables."""
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")

if __name__ == "__main__":
    init_db()
