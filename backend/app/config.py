import os
from dotenv import load_dotenv
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
# This points to the 'backend' folder
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from the .env file explicitly
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = "Multi-Broker Platform"
    VERSION: str = "0.5.0"
    
    # We use this URL to connect to the DB
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY")

settings = Settings()

# Troubleshooting print (Visible in terminal on startup)
if not settings.DATABASE_URL:
    print(f"⚠️ WARNING: DATABASE_URL is None. Checking for .env at: {env_path}")
else:
    print(f"✅ Configuration Loaded. DB URL found.")