from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.routes import auth, communities, users, products, orders


app = FastAPI(
    title="Gather Buy API",
    description="Community-Based Bulk Ordering Platform",
    version="1.0.0"
)

# Configure image uploads directory
BASE_DIR = Path(__file__).resolve().parents[1]
UPLOAD_DIR = BASE_DIR / "uploads"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Serve uploaded images
app.mount(
    "/uploads",
    StaticFiles(directory=UPLOAD_DIR),
    name="uploads"
)

app.include_router(auth.router)
app.include_router(communities.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(orders.router)


@app.get("/")
def home():
    return {
        "message": "Welcome to Gather Buy API!"
    }