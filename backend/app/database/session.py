from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

connect_args = {}
db_url = settings.DATABASE_URL or ""
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
elif ("render.com" in db_url or "dpg-" in db_url) and "sslmode" not in db_url:
    connect_args["sslmode"] = "require"

engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
