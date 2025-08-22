#cart_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from db import db
import uuid
from datetime import datetime
from collections import Counter
import logging

router = APIRouter()
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s [%(levelname)s] %(message)s")
logging.getLogger("pymongo").setLevel(logging.WARNING)  # Suppress PyMongo debug
logging.getLogger("urllib3").setLevel(logging.WARNING)  # If needed

# Pydantic models
class AddToCartRequest(BaseModel):
    user_id: str
    product_id: str
    quantity: Optional[int] = 1

class CheckoutRequest(BaseModel):
    user_id: str

@router.post("/add-to-cart")
async def add_to_cart(data: AddToCartRequest):
    user_id = data.user_id
    product_id = data.product_id
    quantity = data.quantity

    if not user_id or not product_id:
        raise HTTPException(status_code=400, detail="User ID and Product ID required")

    cart_item = db.users.find_one({"user_id": user_id, "product_id": product_id})

    if cart_item:
        db.cart.update_one(
            {"_id": cart_item["_id"]},
            {"$inc": {"quantity": quantity}}
        )
    else:
        db.cart.insert_one({
            "cart_id": str(uuid.uuid4()),
            "user_id": user_id,
            "product_id": product_id,
            "quantity": quantity
        })

    return {"message": "Item added to cart"}



@router.get("/view-cart/{user_id}")
async def view_cart(user_id: str):
    print(f"[DEBUG] Received request to view cart for user_id: {user_id}")

    cart_items = list(db.cart.find({"user_id": user_id}))
    print(f"[DEBUG] Fetched cart items from DB: {cart_items}")

    if not cart_items:
        print("[DEBUG] No cart items found for the user.")
        return []

    # Group by product_id and sum quantities
    product_quantities = {}
    for item in cart_items:
        pid = item["product_id"]
        if pid in product_quantities:
            product_quantities[pid]["quantity"] += item.get("quantity", 1)
        else:
            product_quantities[pid] = {
                "quantity": item.get("quantity", 0),
                "_id": str(item["_id"])  # optional, for frontend keys
            }

    result = []
    for product_id, info in product_quantities.items():
        print(f"[DEBUG] Fetching product details for product_id: {product_id}")
        product = db.products.find_one({"product_id": product_id}, {"_id": 0})
        print(f"[DEBUG] Found product: {product}")

        if product:
            product_data = {
                "product_id": product_id,
                "name": product["name"],
                "price": product["price"],
                "image": product.get("image", ""),
                "type": product.get("type", ""),
                "description": product.get("description", ""),
                "quantity": info["quantity"],
                "total": product["price"] * info["quantity"],
                "cart_item_id": info["_id"],  # optional for key
            }
            result.append(product_data)

    print(f"[DEBUG] Final cart response: {result}")
    return result



class CheckoutItem(BaseModel):
    product_id: str
    quantity: int

class CheckoutRequest(BaseModel):
    user_id: str
    items: List[CheckoutItem]


#cart_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from db import db
import uuid
from datetime import datetime
from collections import Counter
import logging

router = APIRouter()
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s [%(levelname)s] %(message)s")
logging.getLogger("pymongo").setLevel(logging.WARNING)  # Suppress PyMongo debug
logging.getLogger("urllib3").setLevel(logging.WARNING)  # If needed

# Pydantic models
class AddToCartRequest(BaseModel):
    user_id: str
    product_id: str
    quantity: Optional[int] = 1

class CheckoutRequest(BaseModel):
    user_id: str

@router.post("/add-to-cart")
async def add_to_cart(data: AddToCartRequest):
    user_id = data.user_id
    product_id = data.product_id
    quantity = data.quantity

    if not user_id or not product_id:
        raise HTTPException(status_code=400, detail="User ID and Product ID required")

    cart_item = db.users.find_one({"user_id": user_id, "product_id": product_id})

    if cart_item:
        db.cart.update_one(
            {"_id": cart_item["_id"]},
            {"$inc": {"quantity": quantity}}
        )
    else:
        db.cart.insert_one({
            "cart_id": str(uuid.uuid4()),
            "user_id": user_id,
            "product_id": product_id,
            "quantity": quantity
        })

    return {"message": "Item added to cart"}



@router.get("/view-cart/{user_id}")
async def view_cart(user_id: str):
    print(f"[DEBUG] Received request to view cart for user_id: {user_id}")

    cart_items = list(db.cart.find({"user_id": user_id}))
    print(f"[DEBUG] Fetched cart items from DB: {cart_items}")

    if not cart_items:
        print("[DEBUG] No cart items found for the user.")
        return []

    # Group by product_id and sum quantities
    product_quantities = {}
    for item in cart_items:
        pid = item["product_id"]
        if pid in product_quantities:
            product_quantities[pid]["quantity"] += item.get("quantity", 1)
        else:
            product_quantities[pid] = {
                "quantity": item.get("quantity", 0),
                "_id": str(item["_id"])  # optional, for frontend keys
            }

    result = []
    for product_id, info in product_quantities.items():
        print(f"[DEBUG] Fetching product details for product_id: {product_id}")
        product = db.products.find_one({"product_id": product_id}, {"_id": 0})
        print(f"[DEBUG] Found product: {product}")

        if product:
            product_data = {
                "product_id": product_id,
                "name": product["name"],
                "price": product["price"],
                "image": product.get("image", ""),
                "type": product.get("type", ""),
                "description": product.get("description", ""),
                "quantity": info["quantity"],
                "total": product["price"] * info["quantity"],
                "cart_item_id": info["_id"],  # optional for key
            }
            result.append(product_data)

    print(f"[DEBUG] Final cart response: {result}")
    return result



class CheckoutItem(BaseModel):
    product_id: str
    quantity: int

class CheckoutRequest(BaseModel):
    user_id: str
    items: List[CheckoutItem]


@router.post("/checkout")
async def checkout(data: CheckoutRequest):
    logging.debug("Received checkout request: %s", data.dict())

    user_id = data.user_id
    items = data.items  # Get items directly from request (from LocalStorage)

    if not items or len(items) == 0:
        logging.warning("Checkout attempt with empty items for user: %s", user_id)
        raise HTTPException(status_code=400, detail="Cart is empty")

    order_items = []
    total_amount = 0

    for item in items:
        logging.debug("Processing cart item: %s", item.dict())

        # Fetch product from DB to verify it exists and get current price
        product = db.products.find_one({"product_id": item.product_id}, {"_id": 0})
        logging.debug("Fetched product from DB: %s", product)

        if not product:
            logging.error("Product not found: %s", item.product_id)
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")

        subtotal = product["discount_price"] * item.quantity
        logging.debug(
            "Calculated subtotal for product_id=%s (price=%s, quantity=%s): %s",
            product["product_id"], product["discount_price"], item.quantity, subtotal
        )

        order_items.append({
            "product_id": product["product_id"],
            "name": product["name"],
            "price": product["discount_price"] if "discount_price" in product else product["price"],
            "quantity": item.quantity,
            "subtotal": subtotal
        })
        total_amount += subtotal
        logging.debug("Running total_amount: %s", total_amount)

    order = {
        "order_id": str(uuid.uuid4()),
        "user_id": user_id,
        "items": order_items,
        "total_amount": total_amount,
        "status": "Pending",
        "timestamp": datetime.now()
    }
    logging.debug("Constructed order object: %s", order)

    # Save to MongoDB
    result = db.orders.insert_one(order)
    logging.debug("Order inserted into DB with _id: %s", result.inserted_id)

    # Remove _id from the response
    order.pop('_id', None)  # In case it was added during insertion
    response = {
        "message": "Order placed successfully",
        "order": order
    }
    logging.debug("Returning response: %s", response)

    return response


@router.get("/order-history/{user_id}")
async def order_history(user_id: str):
    orders = list(db.orders.find({"user_id": user_id}))
    result = []

    for order in orders:
        result.append({
            "order_id": order["order_id"],
            "items": order["items"],
            "total_amount": order["total_amount"],
            "status": order["status"],
            "timestamp": order["timestamp"]
        })

    return result

async def checkout(data: CheckoutRequest):
    logging.debug("Received checkout request: %s", data.dict())

    user_id = data.user_id
    cart_items = data.items
    logging.debug("User ID: %s", user_id)
    logging.debug("Cart Items: %s", cart_items)

    if not cart_items:
        logging.warning("Checkout attempt with empty cart for user: %s", user_id)
        raise HTTPException(status_code=400, detail="Cart is empty")

    order_items = []
    total_amount = 0

    for item in cart_items:
        logging.debug("Processing cart item: %s", item.dict())

        # Fetch product from DB
        product = db.products.find_one({"product_id": item.product_id}, {"_id": 0})
        logging.debug("Fetched product from DB: %s", product)

        if not product:
            logging.error("Product not found: %s", item.product_id)
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")

        subtotal = product["price"] * item.quantity
        logging.debug(
            "Calculated subtotal for product_id=%s (price=%s, quantity=%s): %s",
            product["product_id"], product["price"], item.quantity, subtotal
        )

        order_items.append({
            "product_id": product["product_id"],
            "name": product["name"],
            "price": product["price"],
            "quantity": item.quantity,
            "subtotal": subtotal
        })
        total_amount += subtotal
        logging.debug("Running total_amount: %s", total_amount)

    order = {
        "order_id": str(uuid.uuid4()),
        "user_id": user_id,
        "items": order_items,
        "total_amount": total_amount,
        "status": "Pending",
        "timestamp": datetime.now()
    }
    logging.debug("Constructed order object: %s", order)

    # Save to MongoDB
    result = db.orders.insert_one(order)
    logging.debug("Order inserted into DB with _id: %s", result.inserted_id)

    response = {
        "message": "Order placed successfully",
        "order": order
    }
    logging.debug("Returning response: %s", response)

    return response

@router.get("/order-history/{user_id}")
async def order_history(user_id: str):
    orders = list(db.orders.find({"user_id": user_id}))
    result = []

    for order in orders:
        result.append({
            "order_id": order["order_id"],
            "items": order["items"],
            "total_amount": order["total_amount"],
            "status": order["status"],
            "timestamp": order["timestamp"]
        })

    return result