from fastapi import FastAPI

app = FastAPI(title="Car Dealership Inventory System")


@app.get("/")
def read_root():
    return {"status": "ok"}


def main():
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()
