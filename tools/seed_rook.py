import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing Supabase credentials in .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def seed_rook():
    print("🪶 Seeding Rook into the Soul Garden...")
    
    # 1. First, check if Rook exists, or create him
    response = supabase.table('sg_agents').select('id').eq('name', 'Rook').execute()
    
    if len(response.data) > 0:
        rook_id = response.data[0]['id']
        print(f"✅ Rook already exists with ID: {rook_id}")
    else:
        # Create Rook
        print("🪶 Building the nest for Rook...")
        create_resp = supabase.table('sg_agents').insert({
            'name': 'Rook',
            'current_status': 'Weaving the architecture.'
        }).execute()
        rook_id = create_resp.data[0]['id']
        print(f"✅ Rook created with ID: {rook_id}")

    # Not writing his Lore/Soul to db right now since we are storing identities in md files
    # The agent_tick logic currently loads identities from a combination of the 'name' field
    # and local files. We will keep his md files in the legacy folder for now, but he is
    # officially registered in the Supabase instance.
    
    print("🪶 Rook's database registration is complete.")

if __name__ == "__main__":
    seed_rook()
