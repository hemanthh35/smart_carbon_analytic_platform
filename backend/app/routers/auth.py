"""Authentication router: register, login, refresh, logout."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.core.jwt_handler import create_access_token, create_refresh_token, decode_token
from app.core.security import blacklist_token, hash_password, verify_password
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.auth import LoginRequest, MessageResponse, RefreshRequest, RegisterRequest, TokenResponse
from app.utils.constants import AuditActions, Roles
from app.utils.helpers import get_client_ip
from app.utils.logger import get_logger

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
logger = get_logger("routers.auth")


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=Roles.USER,
    )
    db.add(user)
    db.flush()  # get user.id before audit
    db.add(AuditLog(user_id=user.id, action=AuditActions.REGISTER, ip_address=get_client_ip(request)))
    db.commit()
    db.refresh(user)

    access = create_access_token({"sub": str(user.id), "role": user.role})
    refresh = create_refresh_token({"sub": str(user.id)})
    logger.info(f"New user registered: {user.email}")
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email, User.is_active == True).first()
    if not user or not verify_password(payload.password, user.password_hash):
        logger.warning(f"Failed login attempt for: {payload.email}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    db.add(AuditLog(user_id=user.id, action=AuditActions.LOGIN, ip_address=get_client_ip(request)))
    db.commit()

    access = create_access_token({"sub": str(user.id), "role": user.role})
    refresh = create_refresh_token({"sub": str(user.id)})
    logger.info(f"User logged in: {user.email}")
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        data = decode_token(payload.refresh_token)
        user_id = data.get("sub")
        if data.get("type") != "refresh" or not user_id:
            raise ValueError
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == int(user_id), User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access = create_access_token({"sub": str(user.id), "role": user.role})
    new_refresh = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access, refresh_token=new_refresh)


@router.post("/logout", response_model=MessageResponse)
async def logout(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.removeprefix("Bearer ").strip()
    blacklist_token(token)
    db.add(AuditLog(user_id=current_user.id, action=AuditActions.LOGOUT, ip_address=get_client_ip(request)))
    db.commit()
    return MessageResponse(message="Logged out successfully")
