from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app import schemas, crud, config
from app.database import get_db
import httpx
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

@router.post("/login", response_model=schemas.Token)
def login(
    login_data: schemas.UserLogin, 
    request: Request,  # <--- We need the Request object to get IP
    db: Session = Depends(get_db)
):
    # A. Verify with Supabase (Same as before)
    auth_url = f"{config.settings.SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": config.settings.SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "email": login_data.email,
        "password": login_data.password
    }

    try:
        response = httpx.post(auth_url, headers=headers, json=payload)
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Auth service unavailable: {e}")

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    auth_response = response.json()
    access_token = auth_response.get("access_token")

    # B. Verify Local Profile (Same as before)
    db_user = crud.get_user_by_email(db, email=login_data.email)
    if not db_user or not db_user.is_active:
        raise HTTPException(status_code=403, detail="User account is disabled or not found")

    # C. LOGGING: Create Session Record [TRD: 28]
    # Get IP: 'X-Forwarded-For' is best for cloud/proxies, fallback to client.host
    client_ip = request.headers.get("x-forwarded-for", request.client.host)
    user_agent = request.headers.get("user-agent", "unknown")
    
    new_session = crud.create_user_session(db, db_user.id, client_ip, user_agent)

    # D. Return Token (We do not attach session_id to JWT here to avoid complexity, 
    # but the frontend will hold the token. For strict tracking, frontend calls logout.)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }

@router.post("/logout")
def logout(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
):
    # 1. Verify token with Supabase to get the User ID
    # We call the Supabase 'User' endpoint using the token provided
    user_url = f"{config.settings.SUPABASE_URL}/auth/v1/user"
    headers = {
        "apikey": config.settings.SUPABASE_KEY,
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = httpx.get(user_url, headers=headers)
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Auth provider unavailable")

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_data = response.json()
    user_id = user_data.get("id")

    # 2. Find the active session for this user
    active_session = crud.get_active_session(db, user_id)
    
    if active_session:
        # 3. Close the session
        crud.end_user_session(db, active_session.id)
        return {"status": "success", "message": "Logged out successfully"}
    
    return {"status": "warning", "message": "User was logged in, but no active session record found."}