import uvicorn
from database import Base, engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from route import router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Car Dealership Inventory System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
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
