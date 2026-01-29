from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.config import settings
from app.database import get_db, engine
from app import models
from app.routers import users, auth, strategies
from fastapi.middleware.cors import CORSMiddleware

# THIS LINE CREATES THE TABLES AUTOMATICALLY
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION
)

# --- ADD CORS MIDDLEWARE HERE ---
# This tells the browser: "It's okay to accept responses from this server"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (Safe for dev/Codespaces)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Include the User Router
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(strategies.router)

@app.get("/")
def read_root():
    return {"status": "active", "system": "Multi-Broker Platform Alpha Layer"}

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Check database connection using SQLAlchemy.
    Executing 'SELECT 1' is the standard way to ping a SQL DB.
    """
    try:
        # Try to execute a simple query
        db.execute(text("SELECT 1"))
        return {"db_status": "connected", "mode": "SQLAlchemy"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))