from fastapi import APIRouter
from app.schemas.msg import Msg

router = APIRouter()

@router.get("/health", response_model=Msg)
def health_check():
    """
    Health check endpoint.
    """
    return {"msg": "OK"}
