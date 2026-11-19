
from decimal import Decimal

from app.db.session import SessionLocal
from app.models.product import Product


PRODUCTS = [
    {
        "name": "Premium Basmati Rice",
        "description": "Premium quality long-grain basmati rice",
        "unit": "kg",
        "retail_price": Decimal("135.00"),
        "stock_on_hand": 100,
    },
    {
        "name": "Brown Rice",
        "description": "Healthy whole-grain brown rice",
        "unit": "kg",
        "retail_price": Decimal("120.00"),
        "stock_on_hand": 100,
    },
    {
        "name": "Matta Rice",
        "description": "Traditional Kerala red matta rice",
        "unit": "kg",
        "retail_price": Decimal("65.00"),
        "stock_on_hand": 150,
    },
    {
        "name": "Wheat Flour",
        "description": "Fresh whole wheat flour",
        "unit": "kg",
        "retail_price": Decimal("55.00"),
        "stock_on_hand": 100,
    },
    {
        "name": "Sugar",
        "description": "Fine quality white sugar",
        "unit": "kg",
        "retail_price": Decimal("48.00"),
        "stock_on_hand": 150,
    },
    {
        "name": "Toor Dal",
        "description": "Premium quality split pigeon peas",
        "unit": "kg",
        "retail_price": Decimal("145.00"),
        "stock_on_hand": 80,
    },
    {
        "name": "Moong Dal",
        "description": "Yellow split green gram",
        "unit": "kg",
        "retail_price": Decimal("125.00"),
        "stock_on_hand": 80,
    },
    {
        "name": "Sunflower Oil",
        "description": "Refined sunflower cooking oil",
        "unit": "litre",
        "retail_price": Decimal("160.00"),
        "stock_on_hand": 100,
    },
    {
        "name": "Coconut Oil",
        "description": "Pure coconut cooking oil",
        "unit": "litre",
        "retail_price": Decimal("220.00"),
        "stock_on_hand": 75,
    },
    {
        "name": "Salt",
        "description": "Iodized table salt",
        "unit": "kg",
        "retail_price": Decimal("25.00"),
        "stock_on_hand": 150,
    },
    {
        "name": "Red Onion",
        "description": "Fresh red onions",
        "unit": "kg",
        "retail_price": Decimal("45.00"),
        "stock_on_hand": 100,
    },
    {
        "name": "Potato",
        "description": "Fresh farm potatoes",
        "unit": "kg",
        "retail_price": Decimal("40.00"),
        "stock_on_hand": 100,
    },
    {
        "name": "Tomato",
        "description": "Fresh ripe tomatoes",
        "unit": "kg",
        "retail_price": Decimal("35.00"),
        "stock_on_hand": 100,
    },
    {
        "name": "Green Chilli",
        "description": "Fresh green chillies",
        "unit": "kg",
        "retail_price": Decimal("60.00"),
        "stock_on_hand": 50,
    },
    {
        "name": "Milk",
        "description": "Fresh toned milk",
        "unit": "litre",
        "retail_price": Decimal("60.00"),
        "stock_on_hand": 100,
    },
    {
        "name": "Eggs",
        "description": "Farm fresh eggs",
        "unit": "piece",
        "retail_price": Decimal("7.00"),
        "stock_on_hand": 300,
    },
    {
        "name": "Wheat Bread",
        "description": "Fresh whole wheat bread",
        "unit": "pack",
        "retail_price": Decimal("45.00"),
        "stock_on_hand": 50,
    },
    {
        "name": "Tea Powder",
        "description": "Premium Assam tea powder",
        "unit": "250g pack",
        "retail_price": Decimal("110.00"),
        "stock_on_hand": 60,
    },
    {
        "name": "Coffee Powder",
        "description": "Filter coffee powder",
        "unit": "250g pack",
        "retail_price": Decimal("140.00"),
        "stock_on_hand": 60,
    },
    {
        "name": "Banana",
        "description": "Fresh Kerala bananas",
        "unit": "kg",
        "retail_price": Decimal("55.00"),
        "stock_on_hand": 100,
    },
]


def seed_products():
    db = SessionLocal()

    try:
        added_count = 0
        skipped_count = 0

        for product_data in PRODUCTS:

            existing_product = (
                db.query(Product)
                .filter(Product.name == product_data["name"])
                .first()
            )

            if existing_product:
                skipped_count += 1
                continue

            product = Product(**product_data)
            db.add(product)
            added_count += 1

        db.commit()

        print("Product seeding completed!")
        print(f"Products added: {added_count}")
        print(f"Products skipped: {skipped_count}")

    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {e}")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_products()
