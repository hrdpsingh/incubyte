import os
from contextlib import asynccontextmanager

import uvicorn
from database import Base, engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from model import User
from route import hash_password, router
from sqlalchemy.orm import Session


def create_admin():
    username = "Admin"
    password = os.getenv("ADMIN_PASSWORD")

    if not password:
        print("Warning: ADMIN_PASSWORD environment variable is not set in Render.")
        return

    with Session(engine) as session:
        existing = session.get(User, username)
        if existing:
            print(f"User '{username}' already exists.")
        else:
            admin = User(
                username=username,
                password_hash=hash_password(password),
                is_admin=True,
            )
            session.add(admin)
            session.commit()
            print(f"Created admin user '{username}'.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    create_admin()
    yield


app = FastAPI(title="Car Dealership Inventory System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def read_root():
    return {"status": "ok"}


def main():
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
