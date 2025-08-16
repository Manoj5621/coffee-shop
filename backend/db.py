import os
from pymongo import MongoClient
import certifi
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Read MONGO_URI from .env
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    print("❌ MONGO_URI not found in .env file.")
    exit(1)

try:
    # Connect to MongoDB Atlas using TLS and certifi certificate
    client = MongoClient(
        MONGO_URI,
        tls=True,
        tlsCAFile=certifi.where()
    )

    # Test the connection
    client.admin.command("ping")
    print("✅ Connected to MongoDB Atlas")

    # Access the specific database
    db = client["coffee_shop_db"]

    # Optional: list available collections
    print("📁 Collections:", db.list_collection_names())

except Exception as e:
    print("❌ Failed to connect to MongoDB:")
    print(str(e))
