from datetime import timedelta
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.schemas.auth import LoginRequest, Token, ChangePassword, ChangeUsername
from app.core.auth import authenticate_user, create_access_token, verify_password, get_password_hash
from app.core.config import settings
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.msg import Msg

router = APIRouter()


@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Login endpoint to get access token.
    """
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if there's a non-default user in the system
    non_default_user_exists = db.query(User).filter(User.is_default == False).first()
    
    # If a non-default user exists and current user is trying to login with default account, block it
    if non_default_user_exists and user.is_default:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Default credentials are no longer valid. Please use your custom credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/change-password", response_model=Msg)
def change_password(
    password_data: ChangePassword,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change current user's password.
    """
    user = db.query(User).filter(User.username == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    user.hashed_password = get_password_hash(password_data.new_password)
    
    # If this was the default admin, mark it as no longer default
    if user.is_default:
        user.is_default = False
    
    db.commit()
    return {"msg": "Password updated successfully"}


@router.post("/change-username", response_model=Msg)
def change_username(
    username_data: ChangeUsername,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change the username (single user system).
    """
    user = db.query(User).filter(User.username == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(username_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is incorrect"
        )
    
    user.username = username_data.new_username
    
    # If this was the default admin, mark it as no longer default
    if user.is_default:
        user.is_default = False
    
    db.commit()
    return {"msg": "Username updated successfully"}
