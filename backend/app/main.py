from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.exceptions import AppError
from app.middleware.error_handler import app_error_handler
from app.routers import (
    auth,
    corrective_actions,
    farms,
    gis,
    health_records,
    incidents,
    media,
    notifications,
    officer,
    risk,
    users,
)


def _auto_seed():
    """Run DB migrations + seed on startup if not already done. Safe to call multiple times."""
    try:
        import subprocess
        import sys
        # Run alembic upgrade head
        subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            check=True,
            capture_output=True,
        )
    except Exception as e:
        print(f"[startup] alembic upgrade warning: {e}")

    try:
        from sqlalchemy.orm import Session
        from app.database.session import engine
        from app.models.user import User

        with Session(engine) as db:
            if db.query(User).filter(User.email == "farmer@bioshield.local").first():
                print("[startup] Database already seeded. Skipping.")
                return

        # Import and run seed
        import importlib.util, os
        seed_path = os.path.join(os.path.dirname(__file__), "..", "scripts", "seed.py")
        seed_path = os.path.abspath(seed_path)
        spec = importlib.util.spec_from_file_location("seed", seed_path)
        seed_mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(seed_mod)
        seed_mod.seed()
        print("[startup] Database seeded successfully.")
    except Exception as e:
        print(f"[startup] Seed warning (non-fatal): {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run on startup
    _auto_seed()
    yield
    # Run on shutdown (nothing needed)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description="AgriSentinel — Digital Farm Biosecurity Platform API",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    origins = settings.cors_origin_list
    has_wildcard = "*" in origins

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if has_wildcard else origins,
        allow_origin_regex=None if has_wildcard else r"https://.*\.vercel\.app",
        allow_credentials=not has_wildcard,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(AppError, app_error_handler)

    upload_path = Path(settings.UPLOAD_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")

    prefix = settings.API_V1_PREFIX
    app.include_router(auth.router, prefix=prefix)
    app.include_router(users.router, prefix=prefix)
    app.include_router(farms.router, prefix=prefix)
    app.include_router(incidents.router, prefix=prefix)
    app.include_router(corrective_actions.router, prefix=prefix)
    app.include_router(media.router, prefix=prefix)
    app.include_router(risk.router, prefix=prefix)
    app.include_router(gis.router, prefix=prefix)
    app.include_router(officer.router, prefix=prefix)
    app.include_router(notifications.router, prefix=prefix)
    app.include_router(health_records.router, prefix=prefix)

    @app.get("/health")
    def health_check():
        return {"status": "ok", "service": settings.APP_NAME}

    return app


app = create_app()
