from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, crud, models, config  # <--- Added 'models' here
from app.database import get_db
from app.routers.auth import oauth2_scheme
import httpx

router = APIRouter(
    prefix="/strategies",
    tags=["strategies"]
)

# Helper to get current user ID from token
async def get_current_user_id(token: str = Depends(oauth2_scheme)):
    user_url = f"{config.settings.SUPABASE_URL}/auth/v1/user"
    headers = {
        "apikey": config.settings.SUPABASE_KEY,
        "Authorization": f"Bearer {token}"
    }
    response = httpx.get(user_url, headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")
    return response.json().get("id")

@router.post("/", response_model=schemas.StrategyResponse)
def create_strategy(
    strategy: schemas.StrategyCreate, 
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Create a new multi-leg strategy.
    TRD [85]: Immutable once created.
    """
    return crud.create_strategy(db=db, strategy=strategy, user_id=user_id)

@router.get("/", response_model=list[schemas.StrategyResponse])
def read_strategies(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    # 1. Get the full user profile to check the role
    # We use 'models.Profile' here, which required the import we just added
    current_user = db.query(models.Profile).filter(models.Profile.id == user_id).first()
    
    if not current_user:
        raise HTTPException(status_code=404, detail="User profile not found")

    # 2. TRD [31]: Super Admin has "Full" access -> See ALL strategies
    if current_user.role == 'super_admin':
        return db.query(models.Strategy).all()
    
    # 3. Everyone else (Analyst/Admin) sees ONLY their own strategies
    return crud.get_user_strategies(db, user_id)