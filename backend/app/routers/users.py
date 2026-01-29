from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import schemas, crud, models
from app.database import get_db
from app.routers.auth import oauth2_scheme
from app.routers.strategies import get_current_user_id
import httpx
from app import config
from uuid import UUID

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

# Helper to get full current user object (to check roles)
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user_id = crud.get_user_by_email # Logic needs ID not email, let's simpler fetch
    # Quick fetch from Supabase to get ID then DB
    user_url = f"{config.settings.SUPABASE_URL}/auth/v1/user"
    headers = {
        "apikey": config.settings.SUPABASE_KEY,
        "Authorization": f"Bearer {token}"
    }
    response = httpx.get(user_url, headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = response.json().get("id")
    user = db.query(models.Profile).filter(models.Profile.id == user_id).first()
    return user

# 1. LIST ALL USERS (Super Admin & Admin)
@router.get("/", response_model=list[schemas.UserResponse])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    current_user: models.Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized to view users")
    return crud.get_all_users(db, skip=skip, limit=limit)

# 2. CREATE USER (Existing - Secured)
@router.post("/", response_model=schemas.UserResponse)
def create_user(
    user: schemas.UserCreate, 
    current_user: models.Profile = Depends(get_current_user), # Added security
    db: Session = Depends(get_db)
):
    if current_user.role != 'super_admin':
        raise HTTPException(status_code=403, detail="Only Super Admin can create users")
        
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        new_user = crud.create_user_profile(db=db, user=user)
        return new_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 3. DELETE USER (Super Admin Only)
@router.delete("/{user_id}")
def delete_user(
    user_id: UUID, 
    current_user: models.Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != 'super_admin':
        raise HTTPException(status_code=403, detail="Only Super Admin can delete users")
        
    success = crud.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "message": "User deleted"}

# 4. UPDATE USER (Super Admin & Admin)
@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: UUID, 
    user_update: schemas.UserCreate, 
    current_user: models.Profile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Basic Auth: Only Admins/Super Admins allowed
    if current_user.role not in ['super_admin', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized to edit users")

    # 2. Fetch target user
    target_user = db.query(models.Profile).filter(models.Profile.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # 3. PROTECTION: Admins cannot edit Super Admins
    if current_user.role == 'admin' and target_user.role == 'super_admin':
        raise HTTPException(status_code=403, detail="Admins cannot edit Super Admins")

    # 4. PROTECTION: Admins cannot change ROLES (Privilege Escalation)
    # We check if 'role' is in the update payload AND if it's different from the current role
    incoming_data = user_update.dict(exclude_unset=True)
    
    if current_user.role == 'admin':
        if 'role' in incoming_data and incoming_data['role'] != target_user.role:
            raise HTTPException(status_code=403, detail="Admins cannot change user roles")

    # Perform Update
    updated_user = crud.update_user(db, user_id, incoming_data)
    return updated_user