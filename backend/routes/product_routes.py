from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from db import db
import uuid
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

router = APIRouter()

# Pydantic model for product creation
class ProductCreateRequest(BaseModel):
    name: str
    image: str
    price: float
    discount_price: Optional[float] = None
    type: str
    description: str

# Get all product types
@router.get("/product-types")
async def get_product_types():
    # Get distinct types from products collection
    types = db.products.distinct("type")
    return {"types": types}

@router.post("/add-product")
async def add_product(data: ProductCreateRequest):
    if not data.name or not data.price or not data.image:
        raise HTTPException(status_code=400, detail="Name, price, and image are required")

    product = {
        "product_id": str(uuid.uuid4()),
        "name": data.name,
        "image": data.image,
        "price": data.price,
        "discount_price": data.discount_price,
        "type": data.type,
        "description": data.description
    }

    db.products.insert_one(product)
    return {"message": "Product added successfully"}

@router.get("/products")
async def get_all_products():
    products = list(db.products.find({}, {"_id": 0}))
    return products if products else []

class AddToCartRequest(BaseModel):
    product_id: str

@router.post("/cart/add")
async def add_to_cart(
    data: AddToCartRequest,
    token: str = Depends(oauth2_scheme)
):
    product_id = data.product_id
    
    # Fake user_id until real token decoding logic is added
    user_id = ""  # Replace this with real user_id from token

    db.cart.update_one(
        {"user_id": user_id},
        {"$push": {"items": product_id}},
        upsert=True
    )
    return {"message": "Product added to cart"}
