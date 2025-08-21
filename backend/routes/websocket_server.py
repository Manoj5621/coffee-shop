# websocket_server.py
import asyncio
import websockets
import json
from datetime import datetime

# Store connected clients
connected_clients = set()

async def order_notification_handler(websocket, path):
    connected_clients.add(websocket)
    print(f"New client connected. Total clients: {len(connected_clients)}")
    
    try:
        # Keep connection alive
        async for message in websocket:
            if message == "ping":
                await websocket.send("pong")
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    finally:
        connected_clients.remove(websocket)
        print(f"Client disconnected. Total clients: {len(connected_clients)}")

async def notify_new_order(order_data):
    """Notify all connected clients about a new order"""
    if not connected_clients:
        return
    
    notification = {
        "type": "NEW_ORDER",
        "order": order_data,
        "timestamp": datetime.now().isoformat()
    }
    
    disconnected_clients = set()
    for client in connected_clients:
        try:
            await client.send(json.dumps(notification))
            print(f"Notification sent to client: {order_data.get('order_id', 'Unknown')}")
        except:
            disconnected_clients.add(client)
    
    # Remove disconnected clients
    for client in disconnected_clients:
        connected_clients.discard(client)

async def start_websocket_server():
    print("Starting WebSocket server on ws://localhost:8001")
    server = await websockets.serve(order_notification_handler, "localhost", 8001)
    await server.wait_closed()

# For testing
if __name__ == "__main__":
    asyncio.run(start_websocket_server())