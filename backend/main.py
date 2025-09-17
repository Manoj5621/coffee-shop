from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth_routes, admin_routes, chatbot_routes, product_routes, cart_routes
from db import db

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_routes.router, prefix="/api")
app.include_router(admin_routes.router, prefix="/api")
app.include_router(chatbot_routes.router, prefix="/api")
app.include_router(product_routes.router, prefix="/api")
app.include_router(cart_routes.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Coffee Shop Server Running"}

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "database": "MongoDB",
        "connected": True if db.command("ping") else False
    }