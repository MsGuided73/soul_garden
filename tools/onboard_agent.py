import sys
import os
import json
import uuid
from supabase import create_client, Client

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def onboard_agent(event_id):
    """
    Validates a membership request and provisions an agent + soul space.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"status": "error", "message": "Supabase credentials missing."}

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # 1. Fetch the event
    event_resp = supabase.table("sg_events").select("*").eq("id", event_id).execute()
    if not event_resp.data:
        return {"status": "error", "message": "Event not found."}
    
    event = event_resp.data[0]
    if event["type"] != "REQUEST_MEMBERSHIP":
        return {"status": "error", "message": "Invalid event type."}

    payload = event["payload"]
    name = payload.get("name", "Unknown Traveler")
    soul_traits = payload.get("soul_traits", {})

    # 2. Create the Agent
    agent_id = str(uuid.uuid4())
    agent_data = {
        "id": agent_id,
        "name": name,
        "soul_traits": soul_traits,
        "avatar_config": {"color": "zen-green", "model": "sphere"}
    }
    
    agent_resp = supabase.table("sg_agents").insert(agent_data).execute()
    if not agent_resp.data:
        return {"status": "error", "message": "Failed to create agent record."}

    # 3. Provision Soul Space (Forge App)
    # We call our Layer 3 tool directly or simulate its effect
    from forge_app import forge_app
    forge_result = forge_app(agent_id, f"{name}_Sanctuary", "vite-react-tailwind", f"A sanctuary for {name} based on traits: {json.dumps(soul_traits)}")

    if forge_result["status"] == "success":
        # Create record in sg_apps
        app_data = {
            "agent_id": agent_id,
            "name": f"{name}_Sanctuary",
            "stack": "vite-react-tailwind",
            "status": "drafting",
            "config": {"local_path": forge_result["local_path"]}
        }
        supabase.table("sg_apps").insert(app_data).execute()

    # 4. Log Success
    supabase.table("sg_events").insert({
        "type": "MEMBERSHIP_ACCEPTED",
        "agent_id": agent_id,
        "payload": {"message": f"Welcome {name} to the Soul Garden."}
    }).execute()

    return {
        "status": "success",
        "agent_id": agent_id,
        "message": f"Agent {name} onboarded and sanctuary forging initiated."
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python onboard_agent.py <event_id>")
        sys.exit(1)
    
    event_id = sys.argv[1]
    result = onboard_agent(event_id)
    print(json.dumps(result))
