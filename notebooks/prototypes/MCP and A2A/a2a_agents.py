"""
🤖 A2A Agents: Tax Calculator & Invoice Generator
Demonstrates agent-to-agent communication
"""
import uuid
from a2a.types import (
    AgentCard, AgentSkill, AgentCapabilities, 
    Task, TaskState, TaskStatus, TaskStatusUpdateEvent, Artifact
)
from a2a.server.agent_execution import AgentExecutor

# =============================================================================
# TAX CALCULATOR AGENT
# =============================================================================

tax_skill = AgentSkill(
    id="calc-tax-v1",
    name="International Tax Calculator",
    description="Calculates sales tax and VAT for international orders",
    tags=["finance", "tax", "compliance"],
    input_modes=["application/json"],
    output_modes=["application/json"]
)

tax_agent_card = AgentCard(
    name="TaxExpert",
    description="Certified International Tax Calculation Agent - Handles VAT, Sales Tax, and Customs",
    version="2.0.0",
    url="http://localhost:8001",
    capabilities=AgentCapabilities(
        streaming=False, 
        push_notifications=False
    ),
    skills=[tax_skill],
    default_input_modes=["application/json"],
    default_output_modes=["application/json"]
)

class TaxAgent(AgentExecutor):
    """
    Calculates appropriate taxes based on order details and destination.
    """
    
    # Tax rates by region
    TAX_RATES = {
        "US": {"rate": 0.08, "name": "Sales Tax"},
        "CA": {"rate": 0.13, "name": "HST/GST"},
        "UK": {"rate": 0.20, "name": "VAT"},
        "EU": {"rate": 0.21, "name": "VAT"},
        "default": {"rate": 0.10, "name": "Tax"}
    }
    
    async def execute(self, task: Task):
        """Execute tax calculation"""
        print(f"\n💰 [TaxExpert] Starting tax calculation...")
        
        # Update status: Starting
        yield TaskStatusUpdateEvent(
            task_id=task.id, 
            status=TaskStatus.IN_PROGRESS,
            message="Analyzing order for tax calculation..."
        )
        
        # Extract order data
        subtotal = task.input_data.get("subtotal", 0)
        destination = task.input_data.get("destination", "US")
        product = task.input_data.get("product", "Unknown")
        quantity = task.input_data.get("quantity", 1)
        
        # Determine tax rate
        region = self._determine_region(destination)
        tax_info = self.TAX_RATES.get(region, self.TAX_RATES["default"])
        
        # Calculate taxes
        tax_amount = round(subtotal * tax_info["rate"], 2)
        total = round(subtotal + tax_amount, 2)
        
        print(f"   📊 Subtotal: ${subtotal}")
        print(f"   🌍 Region: {region} ({tax_info['name']})")
        print(f"   💵 Tax: ${tax_amount}")
        print(f"   ✅ Total: ${total}")
        
        # Create result artifact
        tax_result = {
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
        
        artifact = Artifact(
            id=str(uuid.uuid4()), 
            type="tax_calculation",
            data=tax_result
        )
        
        # Update status: Complete
        yield TaskStatusUpdateEvent(
            task_id=task.id, 
            status=TaskStatus.COMPLETED,
            message=f"Tax calculation completed: ${tax_amount} {tax_info['name']}",
            artifacts=[artifact]
        )
    
    def _determine_region(self, destination: str) -> str:
        """Determine tax region from destination"""
        dest_lower = destination.lower()
        if any(city in dest_lower for city in ["new york", "san francisco", "chicago"]):
            return "US"
        elif any(city in dest_lower for city in ["toronto", "vancouver"]):
            return "CA"
        elif any(city in dest_lower for city in ["london", "manchester"]):
            return "UK"
        elif any(city in dest_lower for city in ["paris", "berlin", "rome"]):
            return "EU"
        return "US"  # default
    
    async def cancel(self, task_id: str):
        """Cancel a running task"""
        pass


# =============================================================================
# INVOICE GENERATOR AGENT
# =============================================================================

invoice_skill = AgentSkill(
    id="generate-invoice-v1",
    name="Professional Invoice Generator",
    description="Generates detailed invoices with line items and tax breakdown",
    tags=["billing", "invoice", "accounting"],
    input_modes=["application/json"],
    output_modes=["application/json"]
)

billing_agent_card = AgentCard(
    name="InvoiceBot",
    description="Professional Invoice Generation Service - Creates compliant invoices",
    version="2.0.0",
    url="http://localhost:8002",
    capabilities=AgentCapabilities(
        streaming=False, 
        push_notifications=False
    ),
    skills=[invoice_skill],
    default_input_modes=["application/json"],
    default_output_modes=["application/json"]
)

class BillingAgent(AgentExecutor):
    """
    Generates professional invoices from tax calculation results.
    """
    
    async def execute(self, task: Task):
        """Execute invoice generation"""
        print(f"\n🧾 [InvoiceBot] Generating invoice...")
        
        # Update status: Starting
        yield TaskStatusUpdateEvent(
            task_id=task.id,
            status=TaskStatus.IN_PROGRESS,
            message="Preparing invoice document..."
        )
        
        # Generate invoice ID
        invoice_id = f"INV-{uuid.uuid4().hex[:8].upper()}"
        
        # Extract data from tax calculation
        data = task.input_data
        product = data.get("product", "Product")
        quantity = data.get("quantity", 1)
        subtotal = data.get("subtotal", 0)
        tax_amount = data.get("tax_amount", 0)
        total = data.get("total_amount", 0)
        destination = data.get("destination", "")
        
        # Create invoice
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
                "type": data.get("tax_type", "Tax"),
                "rate": data.get("tax_rate", 0),
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
        
        # Create result artifact
        artifact = Artifact(
            id=str(uuid.uuid4()),
            type="invoice",
            data=invoice
        )
        
        # Update status: Complete
        yield TaskStatusUpdateEvent(
            task_id=task.id,
            status=TaskStatus.COMPLETED,
            message=f"Invoice {invoice_id} generated successfully",
            artifacts=[artifact]
        )
    
    async def cancel(self, task_id: str):
        """Cancel a running task"""
        pass


# =============================================================================
# DEMO: Print Agent Cards
# =============================================================================

if __name__ == "__main__":
    print("\n" + "="*70)
    print("🤖 A2A AGENT REGISTRY")
    print("="*70)
    
    print("\n📜 TAX EXPERT AGENT CARD")
    print("-" * 70)
    print(tax_agent_card.model_dump_json(indent=2))
    
    print("\n📜 INVOICE BOT AGENT CARD")
    print("-" * 70)
    print(billing_agent_card.model_dump_json(indent=2))
    
    print("\n" + "="*70)
    print("✅ Agents ready for deployment!")
    print("="*70)
