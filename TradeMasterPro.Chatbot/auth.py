import os
import jwt
from fastapi import Header, HTTPException, status
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ISSUER = os.getenv("JWT_ISSUER")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE")

if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable is not set.")

def verify_jwt_token(authorization: str = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Must be Bearer <token>"
        )
        
    token = parts[1]
    
    try:
        # Decode the token matching standard HS256 algorithm
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"],
            audience=JWT_AUDIENCE,
            issuer=JWT_ISSUER,
            options={"verify_exp": True}
        )
        
        # Check both standard JWT keys and C# ClaimTypes mappings
        user_id = payload.get("sub") or payload.get("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")
        role = payload.get("role") or payload.get("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token does not contain user identifier"
            )
            
        return {
            "id": int(user_id),
            "role": role or "Student"
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
