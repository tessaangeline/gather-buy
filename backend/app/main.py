from fastapi import FastAPI

app = FastAPI(
    title="Gather Buy API",
    description="Community-Based Bulk Ordering Platform",
    version="1.0.0"
)


@app.get("/")
def home():
    return {
        "message": "Welcome to Gather Buy API!"
    }
