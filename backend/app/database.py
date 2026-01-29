from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# 1. Create the database engine
# pool_pre_ping=True checks if the connection is alive before using it
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# 2. Create a SessionLocal class
# Each request will create a new session instance from this class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Create the Base class
# All our database models (tables) will inherit from this
Base = declarative_base()

# Dependency to get the database session in API requests
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()