import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from jose import jwt
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7


class LoginRequest(BaseModel):
    password: str


class LoginResponse(BaseModel):
    token: str


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest):
    from dotenv import load_dotenv
    load_dotenv()
    admin_password = os.getenv("ADMIN_PASSWORD", "admin")

    if body.password != admin_password:
        raise HTTPException(status_code=401, detail="Invalid password")

    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    payload = {"sub": "admin", "exp": expire}
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    return LoginResponse(token=token)
