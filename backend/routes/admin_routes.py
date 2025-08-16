#admin_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import db

router = APIRouter()


class CompleteOrderRequest(BaseModel):
    order_id: str


# ✅ GET all orders
@router.get("/admin/orders")
async def view_all_orders():
    orders = list(db.orders.find())
    result = []

    for order in orders:
        user = db.users.find_one({"user_id": order.get("user_id")})
        result.append({
            "_id": order.get("order_id"),  # Match AdminDashboard key
            "user": {"name": user["name"]} if user else {"name": "Unknown"},
            "createdAt": order.get("timestamp"),  # Match date field
            "items": order.get("items", []),
            "total": order.get("total_amount", 0),  # Match amount field
            "status": order.get("status", "Pending")
        })

    return result



# ✅ PUT Mark order as completed
@router.put("/admin/mark-completed/{order_id}")
async def mark_order_completed(order_id: str):
    result = db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"status": "Completed"}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")

    return {"message": "Order marked as completed"}


# ✅ PUT Cancel order
@router.put("/admin/cancel-order/{order_id}")
async def cancel_order(order_id: str):
    result = db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"status": "Cancelled"}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")

    return {"message": "Order cancelled"}


# ✅ GET Stats (orders count, revenue, etc.)
@router.get("/admin/stats")
async def get_stats():
    orders = list(db.orders.find())
    total_orders = len(orders)
    total_revenue = sum(order.get("total_amount", 0) for order in orders)
    pending_orders = sum(1 for order in orders if order.get("status") == "Pending")
    completed_orders = sum(1 for order in orders if order.get("status") == "Completed")

    return {
        "totalOrders": total_orders,
        "revenue": total_revenue,
        "pendingOrders": pending_orders,
        "completedOrders": completed_orders
    }


# ✅ GET Most popular products
@router.get("/admin/products")
async def get_popular_products():
    pipeline = [
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.product_id",
            "timesOrdered": {"$sum": "$items.quantity"},
            "totalRevenue": {"$sum": {"$multiply": ["$items.quantity", "$items.price"]}}
        }},
        {"$sort": {"timesOrdered": -1}},
        {"$limit": 10}
    ]

    popular = list(db.orders.aggregate(pipeline))

    products = []
    for entry in popular:
        product = db.products.find_one({"product_id": entry["_id"]})
        if product:
            products.append({
                "_id": product.get("product_id"),
                "name": product.get("name"),
                "image": product.get("image"),
                "timesOrdered": entry["timesOrdered"],
                "totalRevenue": entry["totalRevenue"]
            })

    return products

