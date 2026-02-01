import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.api.api_v1.api import api_router

from contextlib import asynccontextmanager
from app.db.base import Base
from app.db.session import engine
import logging.config
from app.core.logging_config import LOGGING

logging.config.dictConfig(LOGGING)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create default admin user if not exists
    from app.db.session import SessionLocal
    from app.models.user import User
    from app.core.auth import get_password_hash
    
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                hashed_password=get_password_hash("admin123"),
                is_default=True
            )
            db.add(admin_user)
            db.commit()
            logger = logging.getLogger("app")
            logger.info("Default admin user created - Please change credentials on first login")
    finally:
        db.close()
    
    # Load schedules
    from app.services.scheduler_service import scheduler_service
    scheduler_service.start()
    scheduler_service.load_jobs_from_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

import time
from fastapi import Request

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Define logger here or get it
    import logging
    logger = logging.getLogger("app.middleware")
    log_msg = f"REQ: {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.4f}s"
    import sys
    print(log_msg) # Force print to stdout 
    sys.stdout.flush()
    logger.info(log_msg)
    return response

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve frontend static files if available
static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")

@app.get("/api")
def root():
    return {"message": "Welcome to Frame Dock API", "docs": f"{settings.API_V1_STR}/docs"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        reload_dirs=["app"],
        reload_includes=["*.py"]
    )
