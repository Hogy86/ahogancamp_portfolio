# travel_server.py
from fastmcp import FastMCP
import httpx

mcp = FastMCP("Travel Assistant Server")

@mcp.tool()
def get_weather(city: str) -> str:
    """Get current weather for any city worldwide."""
    response = httpx.get(f"https://wttr.in/{city}?format=3")
    return response.text

@mcp.tool()
def get_exchange_rate(base: str, target: str) -> str:
    """Get current exchange rate between two currencies."""
    response = httpx.get(
        f"https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/{base.lower()}.json"
    )
    data = response.json()
    rate = data.get(base.lower(), {}).get(target.lower(), "Not found")
    return f"1 {base.upper()} = {rate} {target.upper()}"

@mcp.tool()
def calculate_budget(
    daily_budget: float,
    num_days: int,
    currency: str = "USD"
) -> str:
    """Calculate total trip budget based on daily budget and number of days."""
    total = daily_budget * num_days
    return f"Total budget: {total:.2f} {currency} for {num_days} days"

if __name__ == "__main__":
    mcp.run()