from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID

# This defines the valid roles strictly based on the TRD
UserRole = Literal['super_admin', 'admin', 'analyst', 'account_manager']

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole = 'analyst'
    multiplier: float = Field(default=1.0, ge=1.0, le=10.0, description="TRD A3: 1.0 to 10.0")
    telegram_id: Optional[str] = None

    @validator('multiplier')
    def validate_multiplier_step(cls, v):
        # TRD A3: Multiplier in 0.5 increments
        if (v * 10) % 5 != 0:
            raise ValueError('Multiplier must be in increments of 0.5')
        return v

class UserCreate(UserBase):
    password: str = Field(min_length=8, description="Password for Supabase Auth")

class UserResponse(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Login Request
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Token Response
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse # We return user details along with the token

# --- STRATEGY SCHEMAS ---

class StrategyLegBase(BaseModel):
    leg_index: int = Field(ge=1, le=4, description="Leg number (1-4)")
    action: Literal['buy', 'sell']
    option_type: Optional[Literal['call', 'put']] = None
    quantity: float = 1.0
    strike_value: Optional[float] = None
    strike_mode: Literal['fixed', 'delta'] = 'fixed'
    expiration_days: Optional[int] = None

class StrategyCreate(BaseModel):
    name: Optional[str] = None
    ticker: str
    instrument_type: Literal['equity', 'option', 'future']
    legs: list[StrategyLegBase]

    @validator('legs')
    def validate_legs(cls, v):
        if len(v) > 4: # TRD [96]
            raise ValueError('Maximum of 4 legs allowed')
        return v

class StrategyResponse(StrategyCreate):
    id: UUID
    user_id: UUID
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True