"""
🏪 GlobalStore MCP Server
Provides warehouse and shipping services
"""
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("GlobalStore")

# Inventory database
INVENTORY = {
    "laptop": {"stock": 5, "price": 1000, "sku": "LAP-001"},
    "monitor": {"stock": 2, "price": 300, "sku": "MON-001"},
    "keyboard": {"stock": 15, "price": 80, "sku": "KEY-001"},
    "mouse": {"stock": 20, "price": 25, "sku": "MOU-001"}
}

@mcp.tool()
def check_stock(item_name: str) -> dict:
    """
    Checks if a product is available in the warehouse.
    
    Args:
        item_name: Name of the product (laptop, monitor, keyboard, mouse)
    
    Returns:
        Dictionary with stock status and product details
    """
    item = item_name.lower()
    if item in INVENTORY:
        product = INVENTORY[item]
        return {
            "product": item_name,
            "sku": product["sku"],
            "stock": product["stock"],
            "price": product["price"],
            "available": product["stock"] > 0,
            "message": f"✅ {item_name.title()} is in stock!"
        }
    else:
        return {
            "product": item_name,
            "available": False,
            "message": f"❌ Product '{item_name}' not found in inventory"
        }

@mcp.tool()
def get_shipping_estimate(destination: str, express: bool = False) -> dict:
    """
    Returns shipping time and cost estimate for a destination.
    
    Args:
        destination: Destination city or country
        express: Whether to use express shipping (default: False)
    
    Returns:
        Dictionary with shipping details
    """
    # Shipping zones
    zones = {
        "local": ["san francisco", "oakland", "san jose"],
        "domestic": ["new york", "chicago", "boston", "seattle"],
        "international": ["london", "paris", "tokyo", "sydney"]
    }
    
    dest_lower = destination.lower()
    
    # Determine zone
    if any(city in dest_lower for city in zones["local"]):
        zone = "local"
        days = "1-2" if express else "2-3"
        cost = 5 if express else 0
    elif any(city in dest_lower for city in zones["domestic"]):
        zone = "domestic"
        days = "2-3" if express else "3-5"
        cost = 15 if express else 8
    else:
        zone = "international"
        days = "5-7" if express else "7-14"
        cost = 50 if express else 25
    
    return {
        "destination": destination,
        "zone": zone,
        "shipping_days": days,
        "shipping_cost": cost,
        "express": express,
        "message": f"📦 Shipping to {destination}: {days} business days (${cost})"
    }

@mcp.tool()
def reserve_item(item_name: str, quantity: int = 1) -> dict:
    """
    Reserves items from inventory for an order.
    
    Args:
        item_name: Name of the product
        quantity: Number of items to reserve (default: 1)
    
    Returns:
        Dictionary with reservation status
    """
    item = item_name.lower()
    if item not in INVENTORY:
        return {
            "success": False,
            "message": f"❌ Product '{item_name}' not found"
        }
    
    product = INVENTORY[item]
    if product["stock"] >= quantity:
        # Simulate reservation (in real app, would update database)
        return {
            "success": True,
            "product": item_name,
            "quantity": quantity,
            "sku": product["sku"],
            "unit_price": product["price"],
            "subtotal": product["price"] * quantity,
            "message": f"✅ Reserved {quantity}x {item_name.title()}"
        }
    else:
        return {
            "success": False,
            "product": item_name,
            "requested": quantity,
            "available": product["stock"],
            "message": f"❌ Only {product['stock']} units available"
        }

if __name__ == "__main__":
    print("🏪 Starting GlobalStore MCP Server...")
    print("Available tools: check_stock, get_shipping_estimate, reserve_item")
    mcp.run()
