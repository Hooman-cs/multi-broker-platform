from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, schemas, config
import httpx
import json
from uuid import UUID

# Helper to create user in Supabase Auth (GoTrue)
def create_supabase_auth_user(user: schemas.UserCreate):
    """
    Creates a user in Supabase Auth using the Admin API.
    We need this to get a valid UUID for the profile.
    """
    url = f"{config.settings.SUPABASE_URL}/auth/v1/admin/users"
    headers = {
        "apikey": config.settings.SUPABASE_KEY,
        "Authorization": f"Bearer {config.settings.SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "email": user.email,
        "password": user.password,
        "email_confirm": True # Auto-confirm email for internal users
    }
    
    response = httpx.post(url, headers=headers, json=payload)
    
    if response.status_code != 200 and response.status_code != 201:
        raise Exception(f"Failed to create Auth user: {response.text}")
        
    return response.json()

# Create the Profile in our Database
def create_user_profile(db: Session, user: schemas.UserCreate):
    # 1. Create Auth User first
    auth_data = create_supabase_auth_user(user)
    user_id = auth_data.get("id")
    
    # 2. Create Profile linked to that ID
    db_user = models.Profile(
        id=user_id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        multiplier=user.multiplier,
        telegram_id=user.telegram_id
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str):
    return db.query(models.Profile).filter(models.Profile.email == email).first()

def create_user_session(db: Session, user_id: UUID, ip_address: str, user_agent: str):
    session = models.UserSession(
        user_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

def end_user_session(db: Session, session_id: UUID):
    session = db.query(models.UserSession).filter(models.UserSession.id == session_id).first()
    if session:
        session.logout_time = func.now()
        db.commit()
        db.refresh(session)
    return session

def get_active_session(db: Session, user_id: UUID):
    """
    Finds the most recent session for this user that hasn't been closed (logout_time is None).
    """
    return db.query(models.UserSession)\
             .filter(models.UserSession.user_id == user_id)\
             .filter(models.UserSession.logout_time == None)\
             .order_by(models.UserSession.login_time.desc())\
             .first()

def create_strategy(db: Session, strategy: schemas.StrategyCreate, user_id: UUID):
    # 1. Create the Strategy Container
    db_strat = models.Strategy(
        user_id=user_id,
        name=strategy.name,
        ticker=strategy.ticker,
        instrument_type=strategy.instrument_type
    )
    db.add(db_strat)
    db.commit()
    db.refresh(db_strat)
    
    # 2. Create the Legs
    for leg in strategy.legs:
        db_leg = models.StrategyLeg(
            strategy_id=db_strat.id,
            leg_index=leg.leg_index,
            action=leg.action,
            option_type=leg.option_type,
            quantity=leg.quantity,
            strike_value=leg.strike_value,
            strike_mode=leg.strike_mode,
            expiration_days=leg.expiration_days
        )
        db.add(db_leg)
    
    db.commit()
    return db_strat

def get_user_strategies(db: Session, user_id: UUID):
    # Fetch all strategies for this specific user
    return db.query(models.Strategy).filter(models.Strategy.user_id == user_id).all()
    
# --- USER MANAGEMENT ---

def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Profile).offset(skip).limit(limit).all()

def update_user(db: Session, user_id: UUID, user_update: dict):
    # Get the user
    db_user = db.query(models.Profile).filter(models.Profile.id == user_id).first()
    if not db_user:
        return None
    
    # Update fields dynamically
    for key, value in user_update.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: UUID):
    db_user = db.query(models.Profile).filter(models.Profile.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False