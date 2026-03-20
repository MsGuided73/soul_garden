import sys
import os
import json
import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def rake_sand(agent_id):
    """
    Rakes the Zen Garden sand with persistence and frequency control.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"status": "error", "message": "Supabase credentials missing."}

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # 1. Check current state
    state_resp = supabase.table("sg_garden_state").select("*").eq("key", "sand_raked").execute()
    
    current_time = datetime.datetime.now()
    
    if state_resp.data:
        state = state_resp.data[0]["value"]
        last_raked_at_str = state.get("last_raked_at")
        
        if last_raked_at_str:
            last_raked_at = datetime.datetime.fromisoformat(last_raked_at_str)
            # 12-hour frequency rule
            if (current_time - last_raked_at).total_seconds() < 12 * 3600:
                return {
                    "status": "waiting",
                    "message": "The patterns in the sand are still fresh. Patience brings clarity.",
                    "last_raked_at": last_raked_at_str
                }

    # 2. Update state
    new_value = {
        "is_raked": True,
        "last_raked_by": agent_id,
        "last_raked_at": current_time.isoformat()
    }
    
    # Upsert the state
    supabase.table("sg_garden_state").upsert({
        "key": "sand_raked",
        "value": new_value,
        "updated_at": current_time.isoformat()
    }).execute()

    # 3. Log event
    supabase.table("sg_events").insert({
        "type": "rake_sand",
        "agent_id": agent_id,
        "payload": new_value
    }).execute()

    return {
        "status": "success",
        "message": "The sand is now smooth and harmonious.",
        "data": new_value
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python rake_sand.py <agent_id>")
        sys.exit(1)
    
    agent_id = sys.argv[1]
    result = rake_sand(agent_id)
    print(json.dumps(result))
