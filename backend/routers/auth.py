from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

from database import get_db, User

router = APIRouter()
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "cyberlab-super-secret-key-change-in-production-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str = ""


class LoginRequest(BaseModel):
    username: str
    password: str


def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        username=req.username,
        email=req.email,
        hashed_password=pwd_context.hash(req.password),
        full_name=req.full_name or req.username,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_token(user.id)
    return {"token": token, "user": _user_dict(user)}


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not pwd_context.verify(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user.last_active = datetime.utcnow()
    db.commit()
    
    token = create_token(user.id)
    return {"token": token, "user": _user_dict(user)}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return _user_dict(current_user)


@router.put("/profile")
def update_profile(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    allowed = ["full_name", "avatar"]
    for key in allowed:
        if key in data:
            setattr(current_user, key, data[key])
    db.commit()
    return _user_dict(current_user)


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "avatar": user.avatar,
        "role": user.role,
        "xp": user.xp,
        "level": user.level,
        "rank": user.rank,
        "streak": user.streak,
        "joined_at": user.joined_at.isoformat() if user.joined_at else None,
        "last_active": user.last_active.isoformat() if user.last_active else None,
    }
