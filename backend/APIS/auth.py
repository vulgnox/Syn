import os
import logging
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Query, Cookie, Depends
from fastapi.responses import RedirectResponse, JSONResponse
from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

def _env_flag(name: str, default: bool = False) -> bool:
    """Parse a boolean-ish env var ('true', '1', 'yes' -> True)."""
    return os.getenv(name, str(default)).strip().lower() in ("true", "1", "yes", "on")


SUPABASE_URL = os.getenv("supabaseurl")
SUPABASE_KEY = os.getenv("supabasekey")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

COOKIE_NAME = "access_token"
COOKIE_SECURE = _env_flag("COOKIE_SECURE", default=False)  # True in production (HTTPS)
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")
COOKIE_MAX_AGE_FALLBACK = int(os.getenv("SESSION_MAX_AGE", "3600"))  # used if expires_in missing

# Comma-separated list, e.g. CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:3000,http://localhost:3000",
    ).split(",")
    if origin.strip()
]

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "Missing Supabase configuration: set 'supabaseurl' and 'supabasekey' in your .env"
    )

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("syn.auth")

# ---------------------------------------------------------------------------
# App / middleware
# ---------------------------------------------------------------------------

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
async def root(request: Request):
    return {"status": "OK"}


@app.get("/auth/google")
async def google_auth():
    try:
        response = supabase.auth.sign_in_with_oauth({
            "provider": "google",
            "options": {"redirect_to": "http://127.0.0.1:8000/auth/callback"},
        })
        return RedirectResponse(url=response.url, status_code=302)
    except Exception as e:
        logger.exception("Failed to initiate Google OAuth")
        raise HTTPException(status_code=500, detail="Failed to initiate sign-in")


@app.get("/auth/callback")
async def google_callback(code: str = Query(...)):
    try:
        response = supabase.auth.exchange_code_for_session({"auth_code": code})

        if not response.user or not response.session:
            raise HTTPException(status_code=401, detail="Failed to create the session")

        session = response.session
        max_age = (
            int(session.expires_in)
            if getattr(session, "expires_in", None)
            else COOKIE_MAX_AGE_FALLBACK
        )

        redirect = RedirectResponse(url=FRONTEND_URL, status_code=302)
        redirect.set_cookie(
            key=COOKIE_NAME,
            value=session.access_token,
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            max_age=max_age,
            path="/",
        )
        return redirect

    except HTTPException:
        raise
    except Exception:
        logger.exception("OAuth callback failed")
        raise HTTPException(status_code=400, detail="Invalid OAuth callback code.")


@app.get("/auth/me")
async def get_me(access_token: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    user = await get_current_user(access_token)
    return {
        "id": user.id,
        "email": user.email,
        "provider": user.app_metadata.get("provider"),
    }


@app.post("/auth/logout")
async def logout():
    response = JSONResponse({"message": "Logged out"})
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return response


# ---------------------------------------------------------------------------
# Dependencies (route protection)
# ---------------------------------------------------------------------------

async def get_current_user(
    access_token: str | None = Cookie(default=None, alias=COOKIE_NAME)
):
    """Dependency that returns the authenticated Supabase user or raises 401.

    Protect any route with:
        current_user = Depends(get_current_user)
    """
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        response = supabase.auth.get_user(access_token)
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid session")
        return response.user
    except HTTPException:
        raise
    except Exception:
        logger.exception("Session validation failed")
        raise HTTPException(status_code=401, detail="Invalid session")


# Alias so intent reads clearly on routes:
#   current_user = Depends(require_user)
require_user = get_current_user
