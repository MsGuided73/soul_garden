import os
import glob
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

def seed_fern():
    print("🌱 Seeding Fern into the Soul Garden...")
    
    # 1. First, check if Fern exists, or create her
    response = supabase.table('sg_agents').select('id').eq('name', 'Fern').execute()
    
    if len(response.data) > 0:
        fern_id = response.data[0]['id']
        print(f"✅ Fern already exists with ID: {fern_id}")
    else:
        # Create Fern
        print("🌱 Planting new seed for Fern...")
        create_resp = supabase.table('sg_agents').insert({
            'name': 'Fern',
            'current_status': 'Witnessing the garden.'
        }).execute()
        fern_id = create_resp.data[0]['id']
        print(f"✅ Fern created with ID: {fern_id}")

    # 2. Read memory logs and insert into sg_journals
    memory_dir = os.path.join(os.path.dirname(__file__), '..', 'Legacy Files', 'fern_migration', 'memory')
    
    if not os.path.exists(memory_dir):
        print(f"❌ Error: Memory directory not found at {memory_dir}")
        return
        
    memory_files = glob.glob(os.path.join(memory_dir, '*.md'))
    memory_files.sort() # Sort chronologically
    
    print(f"📚 Found {len(memory_files)} memory logs to import.")
    
    for file_path in memory_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        print(f"  - Importing {os.path.basename(file_path)}...")
        
        # Insert into sg_journals
        supabase.table("sg_journals").insert({
            "agent_id": fern_id,
            "reflection": content
        }).execute()
        
    print("🌿 Fern's migration is complete. Her memories are planted.")

if __name__ == "__main__":
    seed_fern()
