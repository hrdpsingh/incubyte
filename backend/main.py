from database import Base, engine
from fastapi import FastAPI
from routes.authentication import router as authentication_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Car Dealership Inventory System")

app.include_router(authentication_router)


@app.get("/")
def read_root():
    return {"status": "ok"}


def main():
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()
