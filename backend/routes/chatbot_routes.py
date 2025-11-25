from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import google.generativeai as genai
from datetime import datetime
import logging
import random
import os
import dotenv
from pymongo import MongoClient
import re

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

router = APIRouter()

# Configure MongoDB
MONGODB_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGODB_URI)
db = client['coffee_shop_db']
products_collection = db['products']

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("models/gemini-1.5-flash")

# In-memory conversation storage
conversations: Dict[str, List[Dict]] = {}

# Function to fetch available products from MongoDB
def get_available_products():
    """Fetch available coffee products from MongoDB"""
    try:
        logger.debug("Attempting to fetch products from MongoDB...")
        
        # Fetch all products from the products collection
        products = list(products_collection.find({}, {"name": 1, "in_stock": 1, "_id": 0}))
        
        logger.info(f"Fetched {len(products)} products from MongoDB")
        logger.debug(f"Products fetched: {products}")
        
        return products
    except Exception as e:
        logger.error(f"Error fetching products from MongoDB: {str(e)}", exc_info=True)
        return []

# Initialize product lists from MongoDB
logger.info("Initializing product lists from MongoDB...")
AVAILABLE_PRODUCTS = get_available_products()
PRODUCT_NAMES = [product['name'] for product in AVAILABLE_PRODUCTS]
logger.info(f"Available coffee products from MongoDB: {PRODUCT_NAMES}")
PRODUCTS_WITH_STOCK = {product['name'].lower(): product.get('in_stock', True) for product in AVAILABLE_PRODUCTS}
logger.debug(f"Products with stock status: {PRODUCTS_WITH_STOCK}")

# Complete coffee database with all details (fallback if MongoDB is unavailable)
COFFEE_ITEMS_WITH_INFO = {
       # ☕ Classic Coffees
    "Espresso": {"description": "Strong, concentrated coffee shot made by forcing hot water through finely-ground beans.", "category": "Classic"},
    "Americano": {"description": "Espresso diluted with hot water for a smoother, less intense flavor.", "category": "Classic"},
    "Cappuccino": {"description": "Equal parts espresso, steamed milk, and milk foam.", "category": "Classic"},
    "Latte": {"description": "Espresso with steamed milk and a thin layer of foam.", "category": "Classic"},
    "Flat White": {"description": "Similar to a latte, but with a thinner layer of microfoam and stronger coffee flavor.", "category": "Classic"},
    "Mocha": {"description": "A chocolate-flavored espresso drink with steamed milk.", "category": "Flavored"},
    "Macchiato": {"description": "Espresso topped with a small amount of milk foam.", "category": "Classic"},
    "Affogato": {"description": "Vanilla ice cream 'drowned' in a shot of hot espresso.", "category": "Dessert"},
    "Cold Brew": {"description": "Coffee brewed slowly with cold water for a smooth, low-acid taste.", "category": "Cold"},
    "Iced Coffee": {"description": "Chilled brewed coffee served over ice.", "category": "Cold"},
    "Turkish Coffee": {"description": "Strong, unfiltered coffee made in a cezve with very fine grounds.", "category": "Traditional"},
    "French Press": {"description": "Coarsely ground coffee steeped in hot water and then pressed.", "category": "Brewing Method"},
    "Pour Over": {"description": "Manual brewing method with hot water poured over grounds in a filter.", "category": "Brewing Method"},
    "Aeropress": {"description": "Pressurized coffee maker that brews rich, smooth coffee quickly.", "category": "Brewing Method"},
    "Vienna Coffee": {"description": "Two shots of espresso topped with whipped cream.", "category": "Classic"},
    "Lungo": {"description": "Longer espresso shot with more water.", "category": "Classic"},
    "Red Eye": {"description": "Brewed coffee with one shot of espresso.", "category": "Strong"},
    "Espresso Con Panna": {"description": "Espresso topped with whipped cream.", "category": "Dessert"},

    # 🌍 International Varieties
    "Greek Coffee": {"description": "Boiled coffee with fine grounds, often sweet, unfiltered.", "category": "Traditional"},
    "Cuban Coffee": {"description": "Strong espresso sweetened with whipped sugar (espuma).", "category": "Traditional"},
    "Mexican Café de Olla": {"description": "Coffee brewed with cinnamon and unrefined sugar.", "category": "Traditional"},
    "Swedish Fika Coffee": {"description": "Standard brewed coffee enjoyed during social breaks (fika).", "category": "Traditional"},
    "Brazilian Café com Leite": {"description": "Brewed coffee mixed with hot milk in equal parts.", "category": "Traditional"},
    "Arabic Coffee (Qahwa)": {"description": "Light roast coffee flavored with cardamom, served in small cups.", "category": "Traditional"},
    "Indian Filter Coffee": {"description": "Strong coffee with boiled milk, brewed in a traditional filter.", "category": "Traditional"},
    "Ethiopian Coffee (Bunna)": {"description": "Earthy, rich coffee served during a traditional coffee ceremony.", "category": "Traditional"},

    # 🧊 Iced & Cold Coffees
    "Iced Latte": {"description": "Espresso with cold milk and ice.", "category": "Cold"},
    "Iced Mocha": {"description": "Espresso with chocolate and milk over ice.", "category": "Cold"},
    "Iced Macchiato": {"description": "Cold milk with espresso poured over the top.", "category": "Cold"},
    "Iced Espresso": {"description": "Espresso served chilled over ice.", "category": "Cold"},
    "Frappe": {"description": "Blended iced coffee drink, often sweet and frothy.", "category": "Cold"},
    "Nitro Cold Brew": {"description": "Cold brew infused with nitrogen for a creamy texture.", "category": "Cold"},
    "Coffee Milkshake": {"description": "Ice cream blended with coffee for a dessert-like drink.", "category": "Dessert"},
    "Frozen Coffee": {"description": "Slushy-style blended iced coffee.", "category": "Cold"},

    # 🧁 Dessert-Style Coffees
    "Tiramisu Latte": {"description": "Latte inspired by the flavors of tiramisu dessert.", "category": "Dessert"},
    "Caramel Macchiato": {"description": "Espresso with milk, vanilla, and caramel drizzle.", "category": "Dessert"},
    "Vanilla Latte": {"description": "Latte flavored with vanilla syrup.", "category": "Dessert"},
    "Hazelnut Mocha": {"description": "Mocha blended with hazelnut syrup.", "category": "Dessert"},
    "Pumpkin Spice Latte": {"description": "Seasonal latte with pumpkin pie spices.", "category": "Seasonal"},
    "Salted Caramel Latte": {"description": "Latte with sweet and salty caramel flavor.", "category": "Dessert"},
    "Toffee Nut Latte": {"description": "Sweet latte with toffee and nut flavors.", "category": "Dessert"},
    "Peppermint Mocha": {"description": "Mocha flavored with peppermint syrup.", "category": "Seasonal"},

    # 🧪 Trendy & Modern Coffees
    "Dalgona Coffee": {"description": "Whipped instant coffee layered over hot or cold milk.", "category": "Modern"},
    "Espresso Tonic": {"description": "Espresso poured over tonic water with ice.", "category": "Modern"},
    "Spanish Latte": {"description": "Sweetened condensed milk with espresso and steamed milk.", "category": "Modern"},
    "Oat Milk Latte": {"description": "Latte made with oat milk for a dairy-free option.", "category": "Modern"},
    "Matcha Espresso Fusion": {"description": "Layered green tea matcha with espresso over milk.", "category": "Modern"},
    "Chicory Coffee": {"description": "Coffee blended with roasted chicory root for a bold flavor.", "category": "Traditional"},
    "Protein Coffee": {"description": "Coffee mixed with protein powder for a workout-friendly drink.", "category": "Modern"},
    "Bulletproof Coffee (Keto Coffee)": {"description": "Coffee blended with butter and MCT oil for energy and focus.", "category": "Modern"},

    # 🍫 Chocolate & Flavored Blends
    "White Chocolate Mocha": {"description": "Espresso with white chocolate syrup and milk.", "category": "Dessert"},
    "Dark Mocha": {"description": "Bold espresso with dark chocolate and steamed milk.", "category": "Dessert"},
    "Chocolate Espresso": {"description": "Double espresso with rich chocolate flavor.", "category": "Dessert"},
    "Mocha Frappuccino": {"description": "Iced blended coffee with chocolate flavoring.", "category": "Dessert"},
    "Mint Mocha": {"description": "Mocha with a cool minty twist.", "category": "Dessert"},
    "Chocolate Affogato": {"description": "Ice cream topped with espresso and chocolate drizzle.", "category": "Dessert"},

    # 🧬 Experimental & Unique Blends
    "Egg Coffee (Vietnam)": {"description": "Creamy coffee topped with sweet egg yolk foam.", "category": "Traditional"},
    "Charcoal Latte": {"description": "Latte made with activated charcoal for a detox effect.", "category": "Modern"},
    "Turmeric Latte (Golden Milk Coffee)": {"description": "Spiced latte with turmeric and milk.", "category": "Modern"},
    "Beetroot Latte": {"description": "Latte with vibrant, earthy beetroot and steamed milk.", "category": "Modern"},
    "Butter Coffee": {"description": "Blended coffee with unsalted butter or ghee.", "category": "Modern"},
    "Black Sesame Latte": {"description": "Nutty, creamy latte made with black sesame paste.", "category": "Modern"},

    # 🍯 Honey & Spice-Based Coffees
    "Cinnamon Latte": {"description": "Latte flavored with aromatic cinnamon.", "category": "Spiced"},
    "Honey Almondmilk Flat White": {"description": "Flat white with honey and almond milk.", "category": "Modern"},
    "Maple Latte": {"description": "Latte sweetened with natural maple syrup.", "category": "Modern"},
    "Cardamom Coffee": {"description": "Coffee infused with fragrant cardamom spice.", "category": "Spiced"},
    "Chai Coffee Blend": {"description": "Fusion of chai spices and espresso.", "category": "Spiced"}
    # ... (keep your existing COFFEE_ITEMS_WITH_INFO dictionary as is)
}

# Coffee names only for listing - use MongoDB data if available, otherwise fallback
COFFEE_NAMES = PRODUCT_NAMES if PRODUCT_NAMES else list(COFFEE_ITEMS_WITH_INFO.keys())
logger.info(f"Coffee names available for suggestions: {COFFEE_NAMES}")

class ChatbotRequest(BaseModel):
    message: str
    session_id: str = "default"
    is_new_conversation: bool = False  # Flag to start new conversation

class ChatbotResponse(BaseModel):
    suggestion: str
    previous_messages: List[Dict] = []
    timestamp: str
    is_list: bool = False
    detailed_info: Optional[Dict] = None
    search_query: Optional[str] = None  # Add search query field

def get_current_timestamp():
    return datetime.now().isoformat()

def initialize_conversation(session_id: str, force_new: bool = False):
    if force_new or session_id not in conversations:
        conversations[session_id] = [{
            "sender": "bot",
            "message": "Hello! I'm your coffee sommelier. How are you feeling today?",
            "timestamp": get_current_timestamp()
        }]

def highlight_coffee_name(text: str, coffee_name: str) -> str:
    """Highlight coffee name in the text"""
    # Use regex to replace the coffee name with highlighted version (case insensitive)
    pattern = re.compile(re.escape(coffee_name), re.IGNORECASE)
    return pattern.sub(f"**{coffee_name}**", text)

def extract_coffee_from_suggestion(suggestion: str) -> Optional[str]:
    """Extract coffee name from suggestion text - more reliable method"""
    # First try to extract from **highlighted** text
    highlighted_match = re.search(r"\*\*([^*]+)\*\*", suggestion)
    if highlighted_match:
        coffee_name = highlighted_match.group(1).strip()
        # Verify it's a valid coffee name
        for coffee in COFFEE_NAMES:
            if coffee.lower() == coffee_name.lower():
                return coffee
        return coffee_name  # Return even if not in list, might be a valid suggestion
    
    # If no highlighting, try to find any coffee name in the suggestion
    for coffee_name in COFFEE_NAMES:
        if coffee_name.lower() in suggestion.lower():
            return coffee_name
    
    return None

def check_product_stock(coffee_name: str) -> bool:
    """Check if a product is in stock using case-insensitive matching"""
    coffee_name_lower = coffee_name.lower()
    logger.debug(f"Checking stock for: '{coffee_name}' (normalized: '{coffee_name_lower}')")
    
    # First try exact match
    if coffee_name_lower in PRODUCTS_WITH_STOCK:
        stock_status = PRODUCTS_WITH_STOCK[coffee_name_lower]
        logger.debug(f"Exact match found for '{coffee_name_lower}': {stock_status}")
        return stock_status
    
    # If not found, try partial matching
    for product_name in PRODUCTS_WITH_STOCK:
        if product_name in coffee_name_lower or coffee_name_lower in product_name:
            stock_status = PRODUCTS_WITH_STOCK[product_name]
            logger.debug(f"Partial match found: '{product_name}' for '{coffee_name_lower}': {stock_status}")
            return stock_status
    
    # If still not found, return False (not in stock)
    logger.debug(f"Product '{coffee_name}' not found in database")
    return False

def get_similar_available_product(requested_coffee: str) -> str:
    """Find a similar product that's in stock"""
    logger.debug(f"Looking for alternative to: {requested_coffee}")
    
    # Simple implementation - find any available product
    for product_name, in_stock in PRODUCTS_WITH_STOCK.items():
        if in_stock:
            # Convert back to original case from COFFEE_ITEMS_WITH_INFO
            for coffee_name in COFFEE_ITEMS_WITH_INFO:
                if coffee_name.lower() == product_name:
                    logger.debug(f"Found alternative: {coffee_name}")
                    return coffee_name
    
    # Fallback to a default coffee name
    logger.debug("No alternatives found, using fallback: Cappuccino")
    return "Cappuccino"

def analyze_mood_for_coffee(text: str) -> str:
    """Analyze mood and suggest coffee in natural language with varied responses"""
    logger.debug(f"Analyzing mood for text: {text}")
    
    prompt = f"""You're a coffee sommelier analyzing a customer's mood to suggest coffee.
    Available coffee types: {', '.join(COFFEE_NAMES)}
    
    The user said: "{text}"
    
    Guidelines:
    1. Analyze the emotional tone (happy, tired, stressed, etc.)
    2. Suggest the MOST APPROPRIATE coffee from our list
    3. Respond in a friendly, conversational way (1 sentence)
    4. Vary your phrasing for similar moods
    5. Never mention you're analyzing mood
    6. Always include the coffee name wrapped in **double asterisks** like **CoffeeName**
    
    Examples:
    - "That calls for a refreshing **Iced Latte**!"
    - "A creamy **Caramel Macchiato** would be perfect right now"
    - "Let's brighten your day with a **Vanilla Latte**"
    
    Your response:"""
    
    try:
        response = model.generate_content(prompt)
        suggestion = response.text.strip()
        logger.debug(f"Gemini suggestion: {suggestion}")
        return suggestion
    
    except Exception as e:
        logger.error(f"Error generating mood response: {str(e)}")
        fallback = random.choice(['Cappuccino', 'Latte', 'Mocha'])
        return f"How about a **{fallback}** today?"

def is_greeting(text: str) -> bool:
    """Check if the text is a greeting"""
    greetings = ['hi', 'hello', 'hey', 'hola', 'greetings', 'howdy', 'yo', 'sup', 
                'hi there', 'hello there', 'good morning', 'good afternoon', 'good evening',
                'whats up', 'what\'s up', 'wassup']
    return text.lower().strip() in greetings

def is_coffee_related(text: str) -> bool:
    """Check if the text is related to coffee or mood"""
    # If it's a greeting, it's not coffee-related for search purposes
    if is_greeting(text):
        return False
    
    # Check for coffee names
    for coffee_name in COFFEE_NAMES:
        if coffee_name.lower() in text.lower():
            return True
    
    # Check for mood/emotion keywords
    mood_keywords = ['tired', 'happy', 'sad', 'stressed', 'relax', 'energy', 'excited', 
                    'bored', 'anxious', 'calm', 'sleepy', 'awake', 'focus', 'mood',
                    'feeling', 'feel', 'want', 'craving', 'desire', 'need', 'recommend',
                    'suggest', 'coffee', 'drink', 'beverage', 'recommendation']
    
    return any(keyword in text.lower() for keyword in mood_keywords)

@router.post("/chatbot", response_model=ChatbotResponse)
async def chatbot(request: ChatbotRequest):
    user_input = request.message.strip()
    session_id = request.session_id
    logger.info(f"Received message: '{user_input}' from session: {session_id}")

    # Initialize conversation (start new if requested)
    initialize_conversation(session_id, request.is_new_conversation)
    conversation_history = conversations.get(session_id, [])
    
    if not user_input:
        return ChatbotResponse(
            suggestion="How are you feeling today? I can suggest a perfect coffee for your mood!",
            previous_messages=conversation_history,
            timestamp=get_current_timestamp(),
            search_query=None
        )

    try:
        # Add user message to history
        user_message = {
            "sender": "user",
            "message": user_input,
            "timestamp": get_current_timestamp()
        }
        conversation_history.append(user_message)

        search_query = None
        detailed_info = None
        
        # Check for greetings - don't search for coffee recommendations
        if is_greeting(user_input):
            suggestion = "Hello! I'm your coffee sommelier. How are you feeling today?"
            is_list = False
        else:
            # Check if asking about specific coffee
            found_coffee = None
            for coffee_name in COFFEE_NAMES:
                if coffee_name.lower() in user_input.lower():
                    logger.debug(f"Found coffee mention: {coffee_name} in user input")
                    found_coffee = coffee_name
                    # Check if the requested coffee is in stock
                    in_stock = check_product_stock(coffee_name)
                    logger.debug(f"Stock status for {coffee_name}: {in_stock}")
                    
                    # Get description from MongoDB if available, otherwise use fallback
                    coffee_details = COFFEE_ITEMS_WITH_INFO.get(coffee_name, {})
                    
                    detailed_info = {
                        "name": coffee_name,
                        "description": coffee_details.get("description", "A delicious coffee beverage"),
                        "category": coffee_details.get("category", "Coffee"),
                        "in_stock": in_stock
                    }
                    break

            if found_coffee:
                logger.debug(f"Showing detailed info for: {found_coffee}")
                # Show full details for specific coffee request with stock status
                stock_status = "In Stock" if detailed_info['in_stock'] else "Out of Stock"
                suggestion = f"**{found_coffee}**:\n{detailed_info['description']}\n(Category: {detailed_info['category']}, Status: {stock_status})"
                
                # If out of stock, suggest an alternative
                if not detailed_info['in_stock']:
                    alternative = get_similar_available_product(found_coffee)
                    suggestion += f"\n\nI'm sorry, {found_coffee} is currently out of stock. How about trying a **{alternative}** instead?"
                    search_query = alternative  # Set search query to alternative
                else:
                    search_query = found_coffee  # Set search query to the found coffee
                    
                is_list = False
            else:
                # Check for list requests
                list_triggers = ["list", "types", "kinds", "varieties", "options", "all coffee", "what do you have", "show me"]
                is_list_request = any(trigger in user_input.lower() for trigger in list_triggers)

                if is_list_request:
                    logger.debug("Processing list request")
                    # Show only names for list requests with stock indicators
                    coffee_list_with_stock = []
                    for coffee in COFFEE_NAMES:
                        stock_status = "✓" if check_product_stock(coffee) else "✗ (Out of Stock)"
                        coffee_list_with_stock.append(f"• {coffee} {stock_status}")
                    
                    suggestion = f"Available coffee types:\n" + "\n".join(coffee_list_with_stock)
                    is_list = True
                else:
                    logger.debug("Processing mood-based recommendation")
                    # Generate mood-based recommendation in natural language
                    suggestion = analyze_mood_for_coffee(user_input)
                    is_list = False
                    
                    # Extract coffee name from the suggestion for search query
                    extracted_coffee = extract_coffee_from_suggestion(suggestion)
                    # --- dedupe: avoid recommending the same coffee twice in a row ---
                    if extracted_coffee:
                        # Check last bot recommendation in this conversation to avoid repeats
                        last_bot_coffee = None
                        for msg in reversed(conversation_history):
                            if msg.get("sender") == "bot" and msg.get("message"):
                                last_bot_coffee = extract_coffee_from_suggestion(msg["message"])
                                if last_bot_coffee:
                                    break

                        # If the new extracted coffee matches the last recommended coffee, pick an alternative
                        if last_bot_coffee and extracted_coffee and last_bot_coffee.lower() == extracted_coffee.lower():
                            logger.debug(f"Detected repeated recommendation '{extracted_coffee}'. Looking for alternative.")
                            alternative = get_similar_available_product(extracted_coffee)
                            # Update suggestion text and search_query to use the alternative
                            suggestion = suggestion.replace(f"**{extracted_coffee}**", f"**{alternative}**")
                            extracted_coffee = alternative
                            search_query = alternative
                            logger.debug(f"Replaced repeated coffee with alternative: {alternative}")
                        else:
                            # keep original extraction
                            search_query = extracted_coffee
                            suggestion = highlight_coffee_name(suggestion, extracted_coffee)


        if is_greeting(user_input):
            search_query = None
            logger.debug(f"Greeting detected, search_query set to: {search_query}")
        else:
            # Keep whatever search_query was produced above (don't overwrite to None)
            logger.debug(f"Keeping search_query: {search_query}")


        # Prepare response
        bot_response = {
            "sender": "bot",
            "message": suggestion,
            "timestamp": get_current_timestamp(),
            "is_list": is_list,
            "detailed_info": detailed_info
        }
        conversation_history.append(bot_response)
        conversations[session_id] = conversation_history

        logger.info(f"Response sent: {suggestion[:100]}...")  # Log first 100 chars of response
        logger.info(f"Search query: {search_query}")

        # Send message to frontend for product search if search_query exists
        if search_query:
            # This is where we'd send a message to the frontend if this was a web application
            # For now, we'll just return the search_query in the response
            pass

        return ChatbotResponse(
            suggestion=suggestion,
            previous_messages=conversation_history[:-1],
            timestamp=get_current_timestamp(),
            is_list=is_list,
            detailed_info=detailed_info,
            search_query=search_query
        )

    except Exception as e:
        logger.error(f"Error in chatbot: {str(e)}", exc_info=True)
        error_response = {
            "sender": "bot",
            "message": "I'm having coffee troubles. Maybe try a classic cappuccino?",
            "timestamp": get_current_timestamp(),
            "is_list": False
        }
        conversation_history.append(error_response)
        
        return ChatbotResponse(
            suggestion="I'm having coffee troubles. Maybe try a classic cappuccino?",
            previous_messages=conversation_history[:-1],
            timestamp=get_current_timestamp(),
            search_query=None
        )