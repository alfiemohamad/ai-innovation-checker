from fastapi import APIRouter, Form, HTTPException
from passlib.context import CryptContext
from module.vector import PostgreDB

router = APIRouter()
db = PostgreDB()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def ensure_user_table():
    conn = await db.connect_to_db()
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS user_login (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    await conn.close()

@router.post("/register")
async def register_user(username: str = Form(...), password: str = Form(...)):
    await ensure_user_table()
    conn = await db.connect_to_db()
    user = await conn.fetchrow("SELECT * FROM user_login WHERE username = $1", username)
    if user:
        await conn.close()
        raise HTTPException(status_code=400, detail="Username already exists")
    password_hash = pwd_context.hash(password)
    await conn.execute(
        "INSERT INTO user_login (username, password_hash) VALUES ($1, $2)",
        username, password_hash
    )
    await conn.close()
    return {"status": "success", "message": "User registered successfully"}

@router.post("/login")
async def login_user(username: str = Form(...), password: str = Form(...)):
    await ensure_user_table()
    conn = await db.connect_to_db()
    user = await conn.fetchrow("SELECT * FROM user_login WHERE username = $1", username)
    await conn.close()
    if not user:
        raise HTTPException(status_code=401, detail="Username not found")
    if not pwd_context.verify(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect password")
    return {"status": "success", "message": "Login successful"}
