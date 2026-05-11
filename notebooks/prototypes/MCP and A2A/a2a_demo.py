"""
🎬 A2A Demo - Standalone Version
Shows agent-to-agent workflow concept without complex SDK dependencies
This demonstrates the IDEA of A2A without fighting SDK version issues
"""
import asyncio
import uuid
from typing import Dict, Any

# =============================================================================
# SIMPLE AGENT IMPLEMENTATIONS (No SDK Required)
# =============================================================================

class AgentCard:
    """Simple agent card for discovery"""
    def __init__(self, name, version, description, skills):
        self.name = name
        self.version = version
        self.description = description
        self.skills = skills

class TaxExpertAgent:
    """Tax calculation agent"""
    
    card = AgentCard(
        name="TaxExpert",
        version="2.0.0",
        description="International Tax Calculation Agent",
        skills=["Calculate VAT", "Calculate Sales Tax", "Calculate Customs"]
    )
    
    TAX_RATES = {
        "US": {"rate": 0.08, "name": "Sales Tax"},
        "CA": {"rate": 0.13, "name": "HST/GST"},
        "UK": {"rate": 0.20, "name": "VAT"},
        "EU": {"rate": 0.21, "name": "VAT"},
        "default": {"rate": 0.10, "name": "Tax"}
    }
    
    async def process(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process tax calculation"""
        print(f"\n💰 [TaxExpert] Starting tax calculation...")
        
        # Simulate processing
        await asyncio.sleep(0.5)
        
        subtotal = order_data.get("subtotal", 0)
        destination = order_data.get("destination", "US")
        product = order_data.get("product", "Unknown")
        quantity = order_data.get("quantity", 1)
        
        # Determine region
        dest_lower = destination.lower()
        if "new york" in dest_lower or "chicago" in dest_lower:
            region = "US"
        elif "toronto" in dest_lower:
            region = "CA"
        elif "london" in dest_lower:
            region = "UK"
        else:
            region = "US"
        
        tax_info = self.TAX_RATES.get(region, self.TAX_RATES["default"])
        tax_amount = round(subtotal * tax_info["rate"], 2)
        total = round(subtotal + tax_amount, 2)
        
        print(f"   📊 Subtotal: ${subtotal}")
        print(f"   🌍 Region: {region} ({tax_info['name']})")
        print(f"   💵 Tax: ${tax_amount}")
        print(f"   ✅ Total: ${total}")
        
        return {
            "product": product,
            "quantity": quantity,
            "subtotal": subtotal,
            "tax_region": region,
            "tax_type": tax_info["name"],
            "tax_rate": tax_info["rate"],
            "tax_amount": tax_amount,
            "total_amount": total,
            "destination": destination
        }


class InvoiceBotAgent:
    """Invoice generation agent"""
    
    card = AgentCard(
        name="InvoiceBot",
        version="2.0.0",
        description="Professional Invoice Generation Service",
        skills=["Generate Invoices", "Format Line Items", "Calculate Totals"]
    )
    
    async def process(self, tax_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process invoice generation"""
        print(f"\n🧾 [InvoiceBot] Generating invoice...")
        
        # Simulate processing
        await asyncio.sleep(0.5)
        
        invoice_id = f"INV-{uuid.uuid4().hex[:8].upper()}"
        
        product = tax_data.get("product", "Product")
        quantity = tax_data.get("quantity", 1)
        subtotal = tax_data.get("subtotal", 0)
        tax_amount = tax_data.get("tax_amount", 0)
        total = tax_data.get("total_amount", 0)
        destination = tax_data.get("destination", "")
        
        invoice = {
            "invoice_id": invoice_id,
            "date": "2024-02-08",
            "line_items": [
                {
                    "description": product.title(),
                    "quantity": quantity,
                    "unit_price": round(subtotal / quantity, 2),
                    "amount": subtotal
                }
            ],
            "subtotal": subtotal,
            "tax": {
                "type": tax_data.get("tax_type", "Tax"),
                "rate": tax_data.get("tax_rate", 0),
                "amount": tax_amount
            },
            "total": total,
            "ship_to": destination,
            "status": "ISSUED",
            "summary": f"Invoice {invoice_id} generated for {product} order (${total})"
        }
        
        print(f"   📄 Invoice ID: {invoice_id}")
        print(f"   💰 Amount Due: ${total}")
        print(f"   ✅ Status: ISSUED")
        
        return invoice


# =============================================================================
# AGENT ORCHESTRATOR (Simulates A2A Protocol)
# =============================================================================

class AgentOrchestrator:
    """Simulates A2A agent-to-agent communication"""
    
    def __init__(self):
        self.tax_agent = TaxExpertAgent()
        self.invoice_agent = InvoiceBotAgent()
    
    async def process_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process an order through the agent pipeline
        
        This simulates A2A protocol where:
        1. Order data goes to TaxExpert agent
        2. Tax result goes to InvoiceBot agent
        3. Final invoice is returned
        """
        print("\n" + "="*70)
        print("🔄 AGENT ORCHESTRATION (A2A Protocol Simulation)")
        print("="*70)
        
        # Step 1: Send to Tax Agent
        print("\n📤 Routing to TaxExpert agent...")
        tax_result = await self.tax_agent.process(order_data)
        print("   ✅ Tax calculation complete")
        
        # Step 2: Send to Invoice Agent
        print("\n📤 Routing to InvoiceBot agent...")
        invoice = await self.invoice_agent.process(tax_result)
        print("   ✅ Invoice generation complete")
        
        return invoice


# =============================================================================
# DEMO
# =============================================================================

async def run_demo():
    """Run the complete A2A demo"""
    
    print("\n" + "="*70)
    print("🎬 A2A DEMO: E-Commerce Order Processing")
    print("="*70)
    
    # Discovery phase
    print("\n🔍 [DISCOVERY] Agent Discovery...")
    orchestrator = AgentOrchestrator()
    
    print(f"   ✅ Found: {orchestrator.tax_agent.card.name} v{orchestrator.tax_agent.card.version}")
    print(f"      Skills: {', '.join(orchestrator.tax_agent.card.skills)}")
    
    print(f"   ✅ Found: {orchestrator.invoice_agent.card.name} v{orchestrator.invoice_agent.card.version}")
    print(f"      Skills: {', '.join(orchestrator.invoice_agent.card.skills)}")
    
    # Order data (from MCP)
    print("\n📦 [INPUT] Order Details (from MCP):")
    order_data = {
        "product": "laptop",
        "quantity": 2,
        "subtotal": 2000,
        "destination": "New York"
    }
    print(f"   • Product: {order_data['product'].title()}")
    print(f"   • Quantity: {order_data['quantity']}")
    print(f"   • Subtotal: ${order_data['subtotal']}")
    print(f"   • Destination: {order_data['destination']}")
    
    # Process through agents
    invoice = await orchestrator.process_order(order_data)
    
    # Display results
    print("\n" + "="*70)
    print("✨ FINAL RESULT: ORDER PROCESSED")
    print("="*70)
    print(f"\n📄 {invoice['summary']}")
    print(f"\n   Invoice ID:     {invoice['invoice_id']}")
    print(f"   Date:           {invoice['date']}")
    print(f"   Ship To:        {invoice['ship_to']}")
    print(f"   ")
    print(f"   Subtotal:       ${invoice['subtotal']}")
    print(f"   Tax ({invoice['tax']['type']}): ${invoice['tax']['amount']}")
    print(f"   ─────────────────────")
    print(f"   TOTAL DUE:      ${invoice['total']}")
    print(f"   ")
    print(f"   Status:         {invoice['status']}")
    
    print("\n" + "="*70)
    print("✅ Demo Complete - Agent Workflow Successful!")
    print("="*70)
    
    print("\n💡 What Just Happened (A2A Concept):")
    print("   1. Order data was routed to TaxExpert agent")
    print("   2. TaxExpert calculated taxes autonomously")
    print("   3. Result was passed to InvoiceBot agent")
    print("   4. InvoiceBot generated invoice autonomously")
    print("   5. Agents communicated without human intervention")
    print("\n   This is the core idea of Agent-to-Agent (A2A) protocol!")


if __name__ == "__main__":
    print("="*70)
    print("🚀 Starting A2A Demo (Standalone Version)")
    print("="*70)
    print("\nℹ️  This version demonstrates A2A concepts without complex SDK dependencies")
    print("   Perfect for presentations and understanding the workflow!\n")
    
    try:
        asyncio.run(run_demo())
    except KeyboardInterrupt:
        print("\n\n⚠️  Demo interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Demo failed with error: {e}")
        import traceback
        traceback.print_exc()