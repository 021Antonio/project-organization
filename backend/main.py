import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jose import jwt, JWTError

from database import create_tables
from routes.auth import router as auth_router
from routes.quests import router as quests_router
from routes.player import router as player_router

load_dotenv()

app = FastAPI(title="Hunter Planner API", version="1.0.0")

# CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALGORITHM = "HS256"

# Public routes that don't need auth
PUBLIC_PATHS = ["/api/v1/auth/login", "/docs", "/openapi.json", "/redoc", "/"]


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    path = request.url.path

    # Skip auth for public routes and OPTIONS
    if request.method == "OPTIONS" or any(path.startswith(p) for p in PUBLIC_PATHS):
        return await call_next(request)

    # Check for API routes
    if path.startswith("/api/"):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing or invalid token"},
            )

        token = auth_header.split(" ")[1]
        try:
            jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except JWTError:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or expired token"},
            )

    return await call_next(request)


# Register routers
app.include_router(auth_router)
app.include_router(quests_router)
app.include_router(player_router)


# Create tables on startup
create_tables()


@app.get("/")
def root():
    return {"status": "online", "app": "Hunter Planner"}
