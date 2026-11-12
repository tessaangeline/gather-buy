from fastapi import FastAPI
from app.api.routes import auth

app = FastAPI(
    title="Gather Buy API",
    description="Community-Based Bulk Ordering Platform",
    version="1.0.0"
)

app.include_router(auth.router)

@app.get("/")
def home():
    return {

        "message": "Welcome to Gather Buy API!"
    }
