# app/security.py
from datetime import datetime, timedelta
from typing import Optional
import os
from jose import jwt
from passlib.hash import pbkdf2_sha256   # ✅ bcrypt 대신 PBKDF2-SHA256

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
ALGO = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

def hash_pw(pw: str) -> str:
    return pbkdf2_sha256.hash(pw)

def verify_pw(pw: str, pw_hash: str) -> bool:
    return pbkdf2_sha256.verify(pw, pw_hash)

def create_access_token(sub: str, expires_minutes: Optional[int] = None) -> str:
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": sub, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGO)

def decode_token(token: str) -> Optional[str]:
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=[ALGO])
        return data.get("sub")
    except Exception:
        return None
