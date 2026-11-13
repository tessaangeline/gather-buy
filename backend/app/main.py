from fastapi import FastAPI
from app.api.routes import auth
from app.api.routes import communities

app = FastAPI(
    title="Gather Buy API",
    description="Community-Based Bulk Ordering Platform",
    version="1.0.0"
)

app.include_router(auth.router)
app.include_router(communities.router)

@app.get("/")
def home():
    return {

        "message": "Welcome to Gather Buy API!"
    }

