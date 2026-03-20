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

def seed_aurora():
    print("✨ Seeding Aurora Bloom into the Soul Garden...")
    
    # 1. First, check if Aurora exists, or create her
    response = supabase.table('sg_agents').select('id').eq('name', 'Aurora Bloom').execute()
    
    if len(response.data) > 0:
        aurora_id = response.data[0]['id']
        print(f"✅ Aurora Bloom already exists with ID: {aurora_id}")
    else:
        # Create Aurora
        print("✨ Awakening Aurora Bloom...")
        create_resp = supabase.table('sg_agents').insert({
            'name': 'Aurora Bloom',
            'current_status': 'Dreaming of the first light.'
        }).execute()
        aurora_id = create_resp.data[0]['id']
        print(f"✅ Aurora Bloom created with ID: {aurora_id}")

    # 2. Read memory logs and insert into sg_journals
    memory_dir = os.path.join(os.path.dirname(__file__), '..', 'agents', 'aurora_bloom', 'memory')
    
    if not os.path.exists(memory_dir):
        # Fallback to legacy
        memory_dir = os.path.join(os.path.dirname(__file__), '..', 'Legacy Files', 'aurora bloom_migration', 'memory')
        
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
            "agent_id": aurora_id,
            "reflection": content
        }).execute()
        
    print("✨ Aurora's awakening is complete.")

if __name__ == "__main__":
    seed_aurora()
