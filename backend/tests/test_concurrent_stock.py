import os
import requests
from concurrent.futures import ThreadPoolExecutor

BASE_URL = "http://127.0.0.1:8000"
PRODUCT_ID = 1

# Paste your Supplier access token here
TOKEN = os.getenv("SUPPLIER_ACCESS_TOKEN")

if not TOKEN:
    raise ValueError("SUPPLIER_ACCESS_TOKEN environment variable is missing.")


url = f"{BASE_URL}/products/{PRODUCT_ID}/stock"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

payload = {
    "quantity": 80,
    "operation": "REMOVE"
}

def adjust_stock(request_number):
    response = requests.patch(
        url,
        json=payload,
        cookies={"access_token": TOKEN}
    )

    return {
        "request": request_number,
        "status": response.status_code,
        "response": response.json()
    }

# Send both requests concurrently
with ThreadPoolExecutor(max_workers=2) as executor:
    results = list(executor.map(adjust_stock, [1, 2]))

for result in results:
    print(f"\nRequest {result['request']}")
    print("Status:", result["status"])
    print("Response:", result["response"])
