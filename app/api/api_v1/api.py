from fastapi import APIRouter
from app.api.api_v1.endpoints import health, schedules, docker, auth, system

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(health.router, tags=["health"])
api_router.include_router(schedules.router, prefix="/schedules", tags=["schedules"])
api_router.include_router(docker.router, prefix="/docker", tags=["docker"])
api_router.include_router(system.router, prefix="/system", tags=["system"])
