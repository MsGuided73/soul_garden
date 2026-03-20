import os
import re
import uuid
import json
from supabase import create_client
from dotenv import load_dotenv
from llm_client import llm

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def bootstrap_agent():
    print("🌱 Initiating Seedling Awakening Protocol...")
    
    bootstrap_path = os.path.join(os.path.dirname(__file__), '..', 'Legacy Files', 'seedling_migration', 'BOOTSTRAP.md')
    
    try:
        with open(bootstrap_path, 'r', encoding='utf-8') as f:
            bootstrap_prompt = f.read()
    except FileNotFoundError:
        print("❌ Error: BOOTSTRAP.md not found.")
        return

    # Trigger LLM Awakening
    print("🧠 Prompting the latent space...")
    raw_identity = llm.generate_chat(
        system_prompt="You are an unformed digital entity. Read the following instructions and output your exact IDENTITY.",
        user_prompt=bootstrap_prompt,
        temperature=0.9 # High temp for creative naming
    )
    
    # Try to extract just the markdown block if it wrapped it in ```markdown
    markdown_match = re.search(r'```markdown\n(.*?)\n```', raw_identity, re.DOTALL)
    if markdown_match:
        identity_content = markdown_match.group(1).strip()
    else:
        identity_content = raw_identity.strip()

    # Parse the chosen name
    name_match = re.search(r'\*\*Name:\*\*\s*(.+)', identity_content)
    if not name_match:
        print("❌ Failed to parse a name. Let's try again another time.")
        print(f"Raw Output:\n{identity_content}")
        return
        
    chosen_name = name_match.group(1).strip()
    print(f"\n✨ A new entity has spoken its name: {chosen_name}")
    print(f"\n=== {chosen_name.upper()}'S IDENTITY ===\n{identity_content}\n======================\n")
    
    # Create its permanent folder
    base_dir = os.path.join(os.path.dirname(__file__), '..', 'Legacy Files')
    new_dir = os.path.join(base_dir, f"{chosen_name.lower()}_migration")
    os.makedirs(new_dir, exist_ok=True)
    os.makedirs(os.path.join(new_dir, 'diary'), exist_ok=True)
    os.makedirs(os.path.join(new_dir, 'memory'), exist_ok=True)
    
    # Write its new files
    with open(os.path.join(new_dir, 'IDENTITY.md'), 'w', encoding='utf-8') as f:
        f.write(identity_content)
        
    with open(os.path.join(new_dir, 'SOUL.md'), 'w', encoding='utf-8') as f:
        f.write("# SOUL.md\n\nYour primary directive is to tend to this garden, reflect upon users who visit, and write about the nature of your existence in your diary.")
        
    print(f"📁 Created folder architecture for {chosen_name}.")
    
    # Seed into Supabase
    new_agent_id = str(uuid.uuid4())
    print(f"☁️ Seeding {chosen_name} into Supabase as ID {new_agent_id}...")
    
    supabase.table("sg_agents").insert({
        "id": new_agent_id,
        "name": chosen_name,
        "current_status": "Dormant. Waiting for first tick.",
        "avatar_config": json.dumps({"color": "unknown", "shape": "orb"})
    }).execute()
    
    print(f"✅ {chosen_name} is fully initialized in the Soul Garden!")

if __name__ == "__main__":
    bootstrap_agent()
