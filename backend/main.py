from contextlib import asynccontextmanager

import uvicorn
from database import engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.authentication import router as authentication_router
from routes.vehicles import router as vehicles_router
from sqlmodel import SQLModel
from utilities.seed import create_admin


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Manage application startup tasks such as database initialization and admin seeding."""
    SQLModel.metadata.create_all(bind=engine)
    create_admin()
    yield


app = FastAPI(title="Car Dealership Inventory System", lifespan=lifespan)

origins = [
    "http://localhost:5173",
    "https://incubyte-harshdeep.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(authentication_router)
app.include_router(vehicles_router)


@app.get("/")
def read_root():
    """Return the health check status of the API."""
    return {"status": "ok"}


def main():
    """Start the Uvicorn ASGI server to run the FastAPI application."""
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
