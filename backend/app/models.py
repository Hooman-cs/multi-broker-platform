import uuid
from sqlalchemy import Column, String, Boolean, Numeric, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base



# Define the user roles enum as a Python list for validation if needed, 
# though SQLAlchemy handles the Enum type mapping.
# Enum values must match the SQL type 'user_role' exactly.

class Profile(Base):
    __tablename__ = "profiles"

    # We match the columns defined in the Supabase SQL Editor
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    
    # We treat role as a String here to simplify, but in DB it is an ENUM
    # 'super_admin', 'admin', 'analyst', 'account_manager'
    role = Column(String, nullable=False, default='analyst') 
    
    multiplier = Column(Numeric(3, 1), default=1.0)
    telegram_id = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    
    login_time = Column(DateTime(timezone=True), server_default=func.now())
    logout_time = Column(DateTime(timezone=True), nullable=True)
    
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True) # Browser/Device info
    
    # TRD [28]: Geo IP data (We store the raw IP here; 
    # analysis tools can resolve Geo location from this IP later)
    
    # Relationship to link back to the user
    user = relationship("Profile", backref="sessions")

# --- STRATEGY MODELS ---

class Strategy(Base):
    __tablename__ = "strategies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # TRD [86]: Auto-assigned ID (e.g. STRAT-XXXX) - We use UUID for internal logic
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    
    # TRD [94]: Instruments: Options, Futures, Equities
    instrument_type = Column(String, nullable=False, default='equity') 
    ticker = Column(String, nullable=False) # TRD [95]
    name = Column(String, nullable=True)    # TRD [86]: Friendly Name
    
    # TRD [87-91]: Actions like Create, Clone, Disable
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship to Legs
    legs = relationship("StrategyLeg", backref="strategy", cascade="all, delete-orphan")


class StrategyLeg(Base):
    __tablename__ = "strategy_legs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    strategy_id = Column(UUID(as_uuid=True), ForeignKey("strategies.id"), nullable=False)
    
    # TRD [96]: Up to 4 legs per strategy 
    leg_index = Column(Numeric(1,0), nullable=False) # 1, 2, 3, or 4
    
    # TRD [98]: Action (Buy/Sell)
    action = Column(String, nullable=False) 
    
    # TRD [99]: Type (Call/Put) - Only relevant for Options
    option_type = Column(String, nullable=True) 
    
    # TRD [119]: Quantity 
    quantity = Column(Numeric, default=1)
    
    # TRD [100]: Strike Targeting (Delta or Fixed)
    strike_value = Column(Numeric, nullable=True)
    strike_mode = Column(String, default="fixed") # 'fixed' or 'delta'
    
    # TRD [102]: Expiration Targeting (DTE)
    expiration_days = Column(Numeric, nullable=True) # DTE