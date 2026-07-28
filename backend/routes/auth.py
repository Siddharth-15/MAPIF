# backend/routes/auth.py

import sys
import os
sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from fastapi import APIRouter, HTTPException
from models  import UserRegister, UserLogin, GeneralResponse
from auth    import hash_password, verify_password, create_access_token
from supabase_client import supabase

router = APIRouter()

@router.post("/register", response_model=GeneralResponse)
async def register(user: UserRegister):
    try:
        # Check if email already exists
        existing_email = supabase.table("users")\
            .select("id")\
            .eq("email", user.email)\
            .execute()

        if existing_email.data:
            raise HTTPException(
                status_code=400,
                detail="An account with this email already exists."
            )

        # Check if username already exists
        existing_username = supabase.table("users")\
            .select("id")\
            .eq("username", user.username)\
            .execute()

        if existing_username.data:
            raise HTTPException(
                status_code=400,
                detail="This username is already taken."
            )

        # Hash password and insert user
        hashed = hash_password(user.password[:72])

        result = supabase.table("users").insert({
            "username": user.username,
            "email":    user.email,
            "password": hashed
        }).execute()

        new_user = result.data[0]
        user_id  = new_user["id"]

        token = create_access_token({
            "user_id": user_id,
            "email":   user.email
        })

        return GeneralResponse(
            success = True,
            message = "Account created successfully!",
            data    = {
                "access_token": token,
                "token_type":   "bearer",
                "user": {
                    "id":       user_id,
                    "username": user.username,
                    "email":    user.email
                }
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login", response_model=GeneralResponse)
async def login(user: UserLogin):
    try:
        result = supabase.table("users")\
            .select("*")\
            .eq("email", user.email)\
            .execute()

        if not result.data:
            raise HTTPException(
                status_code=401,
                detail="No account found with this email."
            )

        db_user = result.data[0]

        if not verify_password(user.password[:72], db_user["password"]):
            raise HTTPException(
                status_code=401,
                detail="Incorrect password. Please try again."
            )

        token = create_access_token({
            "user_id": db_user["id"],
            "email":   db_user["email"]
        })

        return GeneralResponse(
            success = True,
            message = "Logged in successfully!",
            data    = {
                "access_token": token,
                "token_type":   "bearer",
                "user": {
                    "id":       db_user["id"],
                    "username": db_user["username"],
                    "email":    db_user["email"]
                }
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/logout", response_model=GeneralResponse)
async def logout():
    return GeneralResponse(
        success=True,
        message="Logged out successfully!"
    )