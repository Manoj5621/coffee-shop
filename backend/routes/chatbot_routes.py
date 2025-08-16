from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import google.generativeai as genai
from datetime import datetime
import logging
import random
import os
import dotenv
4
router = APIRouter()

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("models/gemini-1.5-flash")

# In-memory conversation storage
conversations: Dict[str, List[Dict]] = {}

# Complete coffee database with all details
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
}

# Coffee names only for listing
COFFEE_NAMES = list(COFFEE_ITEMS_WITH_INFO.keys())

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

def get_current_timestamp():
    return datetime.now().isoformat()

def initialize_conversation(session_id: str, force_new: bool = False):
    if force_new or session_id not in conversations:
        conversations[session_id] = [{
            "sender": "bot",
            "message": "Hello! I'm your coffee sommelier. How are you feeling today?",
            "timestamp": get_current_timestamp()
        }]

def format_coffee_list(coffee_list: List[str]) -> str:
    """Format only the coffee names without any additional info"""
    return "\n".join(f"• {name}" for name in coffee_list)

def analyze_mood_for_coffee(text: str) -> str:
    """Analyze mood and suggest coffee in natural language with varied responses"""
    prompt = f"""You're a coffee sommelier analyzing a customer's mood to suggest coffee.
    Available coffee types: {', '.join(COFFEE_NAMES)}
    
    The user said: "{text}"
    
    Guidelines:
    1. Analyze the emotional tone (happy, tired, stressed, etc.)
    2. Suggest the MOST APPROPRIATE coffee from our list
    3. Respond in a friendly, conversational way (1 sentence)
    4. Vary your phrasing for similar moods
    5. Never mention you're analyzing mood
    
    Examples:
    - "That calls for a refreshing Iced Latte!"
    - "A creamy Caramel Macchiato would be perfect right now"
    - "Let's brighten your day with a Vanilla Latte"
    
    Your response:"""
    
    try:
        response = model.generate_content(prompt)
        suggestion = response.text.strip()
        
        # Verify the suggestion contains a valid coffee name
        for coffee in COFFEE_NAMES:
            if coffee.lower() in suggestion.lower():
                return suggestion
        
        # Fallback if no valid coffee found
        return f"How about a {random.choice(['Cappuccino', 'Latte', 'Mocha'])} today?"
    
    except Exception as e:
        logging.error(f"Error generating mood response: {str(e)}")
        return random.choice([
            "A classic Latte would be lovely right now",
            "How about an Espresso to perk you up?",
            "I'd recommend a soothing Chamomile tea"
        ])

@router.post("/chatbot", response_model=ChatbotResponse)
async def chatbot(request: ChatbotRequest):
    user_input = request.message.strip()
    session_id = request.session_id

    # Initialize conversation (start new if requested)
    initialize_conversation(session_id, request.is_new_conversation)
    conversation_history = conversations.get(session_id, [])
    
    if not user_input:
        return ChatbotResponse(
            suggestion="How are you feeling today? I can suggest a perfect coffee for your mood!",
            previous_messages=conversation_history,
            timestamp=get_current_timestamp()
        )

    try:
        # Add user message to history
        user_message = {
            "sender": "user",
            "message": user_input,
            "timestamp": get_current_timestamp()
        }
        conversation_history.append(user_message)

        # Check if asking about specific coffee
        detailed_info = None
        for coffee_name in COFFEE_NAMES:
            if coffee_name.lower() in user_input.lower():
                detailed_info = {
                    "name": coffee_name,
                    **COFFEE_ITEMS_WITH_INFO[coffee_name]
                }
                break

        if detailed_info:
            # Show full details for specific coffee request
            suggestion = f"{detailed_info['name']}:\n{detailed_info['description']}\n(Category: {detailed_info['category']})"
            is_list = False
        else:
            # Check for list requests
            list_triggers = ["list", "types", "kinds", "varieties", "options", "all coffee"]
            is_list_request = any(trigger in user_input.lower() for trigger in list_triggers)

            if is_list_request:
                # Show only names for list requests
                suggestion = f"Available coffee types:\n{format_coffee_list(COFFEE_NAMES)}"
                is_list = True
            else:
                # Generate mood-based recommendation in natural language
                suggestion = analyze_mood_for_coffee(user_input)
                is_list = False

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

        return ChatbotResponse(
            suggestion=suggestion,
            previous_messages=conversation_history[:-1],
            timestamp=get_current_timestamp(),
            is_list=is_list,
            detailed_info=detailed_info
        )

    except Exception as e:
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
            timestamp=get_current_timestamp()
        )

@router.get("/conversation/{session_id}")
async def get_conversation(session_id: str):
    if session_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {
        "conversation": conversations[session_id],
        "timestamp": get_current_timestamp()
    }

@router.get("/coffee-list")
async def get_coffee_list():
    """Returns only coffee names without details"""
    return {
        "coffees": COFFEE_NAMES,
        "count": len(COFFEE_NAMES),
        "timestamp": get_current_timestamp()
    }

@router.get("/coffee-info/{coffee_name}")
async def get_coffee_info(coffee_name: str):
    """Returns full details only when specifically requested"""
    if coffee_name not in COFFEE_ITEMS_WITH_INFO:
        raise HTTPException(status_code=404, detail="Coffee not found")
    return {
        "name": coffee_name,
        **COFFEE_ITEMS_WITH_INFO[coffee_name],
        "timestamp": get_current_timestamp()
    }