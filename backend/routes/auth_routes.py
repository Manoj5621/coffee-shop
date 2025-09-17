from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient
import uuid
import os
from db import db

router = APIRouter()

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup")
async def signup(data: SignupRequest):
    name = data.name
    email = data.email
    password = data.password

    if db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Email already exists")

    hashed_password = generate_password_hash(password)
    user = {
        "user_id": str(uuid.uuid4()),
        "name": name,
        "email": email,
        "password": hashed_password,
    }
    db.users.insert_one(user)

    return {"message": "User registered successfully"}

@router.post("/login")
async def login(data: LoginRequest):
    email = data.email
    password = data.password

    user = db.users.find_one({"email": email})
    if not user or not check_password_hash(user["password"], password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if email == "admin123@gmail.com" and password == "Admin1234":
        user_role = "admin"
    else:
        user_role = "user"
    return {
        "message": "Login successful",
        "user_id": user["user_id"],
        "name": user["name"],
        "email": user["email"],
        "user_role": user_role
    }