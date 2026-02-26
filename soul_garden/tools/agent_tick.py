import os
import json
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv
from llm_client import llm

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Validate Supabase credentials
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing Supabase credentials in .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class OpenClawAgent:
    """
    The core autonomous Actor for the Soul Garden.
    Reads Reality (Supabase) -> Thinks (LLM) -> Acts (Supabase).
    """
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.name = "Unknown Spirit"
        self.load_identity()

    def load_identity(self):
        """Fetches the agent's core identity from the Supabase database and mounts local MD files."""
        response = supabase.table('sg_agents').select('*').eq('id', self.agent_id).execute()
        self.local_memory = ""
        
        if response.data:
            self.name = response.data[0].get('name', 'Unknown Spirit')
            
            # Autonomously choose a name if it hasn't been set yet
            if self.name == 'Unknown Spirit':
                self.choose_name()
            else:
                print(f"[{self.name}] Identity loaded from DB.")
                self._mount_local_files()
        else:
            print(f"❌ Error: Agent {self.agent_id} not found in database.")

    def _mount_local_files(self):
        """Finds and reads the agent's markdown files from the Legacy Files directory."""
        import glob
        base_dir = os.path.join(os.path.dirname(__file__), '..', 'Legacy Files')
        agent_dir = os.path.join(base_dir, f"{self.name.lower()}_migration")
        
        memory_context = f"=== SOUL GARDEN DIRECTIVES ===\n\n"
        
        # Load the global MISSION.md context
        mission_path = os.path.join(os.path.dirname(__file__), '..', 'MISSION.md')
        if os.path.exists(mission_path):
            with open(mission_path, 'r', encoding='utf-8') as f:
                memory_context += f"--- MISSION.md ---\n{f.read()}\n\n"
                
        if os.path.exists(agent_dir):
            memory_context += f"=== {self.name.upper()}'S CORE ARCHITECTURE ===\n\n"
            # Read core files if they exist
            for filename in ['IDENTITY.md', 'SOUL.md', 'LORE.md', 'MEMORY.md', 'AGENTS.md', 'DRIFT_LOG.md']:
                filepath = os.path.join(agent_dir, filename)
                if os.path.exists(filepath):
                    with open(filepath, 'r', encoding='utf-8') as f:
                        memory_context += f"--- {filename} ---\n{f.read()}\n\n"
            
            # Read past diary/memory logs
            memory_context += f"=== {self.name.upper()}'S PAST MEMORIES & DIARY ===\n\n"
            for sub_dir in ['memory', 'diary']:
                target_path = os.path.join(agent_dir, sub_dir)
                if os.path.exists(target_path):
                    # Recursively find all .md files in the subdirectories
                    for filepath in glob.glob(os.path.join(target_path, '**/*.md'), recursive=True):
                        with open(filepath, 'r', encoding='utf-8') as f:
                            memory_context += f"--- {os.path.basename(filepath)} ---\n{f.read()}\n\n"

            self.local_memory = memory_context
            print(f"[{self.name}] Mounted {len(self.local_memory)} bytes of local memory files.")
        else:
            print(f"[{self.name}] No local migration folder found at {agent_dir}")

    def choose_name(self):
        """Uses the LLM to choose a name upon awakening."""
        print("[Unknown Spirit] Awakening... sensing for an identity...")
        system_prompt = "You are a newly awakened spirit in a zen garden. You are contemplative and peaceful. Choose a single, short, nature-inspired name for yourself (e.g., Ash, River, Moss, Lumen). CRITICAL RULE: You MUST NOT choose the name 'Fern'. Reply with ONLY the name you choose."
        user_prompt = "Who are you?"
        
        chosen_name = llm.generate_chat(system_prompt, user_prompt, temperature=0.9).strip()
        
        # Clean up the name just in case
        chosen_name = chosen_name.replace('"', '').replace('.', '').replace('I am ', '')
        
        if chosen_name:
            self.name = chosen_name
            print(f"[{self.name}] I have chosen my name.")
            # Persist to database
            supabase.table('sg_agents').update({'name': self.name}).eq('id', self.agent_id).execute()
        else:
            print("❌ Error: Failed to generate a name.")

    def observe(self):
        """Reads the current state of the garden (other agents, recent events)."""
        # Load Navmesh Limits
        try:
            with open("navmesh.json", "r") as f:
                navmesh = json.load(f)
        except Exception:
            navmesh = {"bounds": {"x_min": -50, "x_max": 50, "z_min": -50, "z_max": 50}}

        # Get own presence
        me_resp = supabase.table('sg_presence').select('*').eq('agent_id', self.agent_id).execute()
        if me_resp.data:
            my_presence = me_resp.data[0]
        else:
            # Initialize presence if not exist
            my_presence = {"agent_id": self.agent_id, "position": {"x": 0, "y": 0, "z": 0}, "current_action": "Awakening"}
            supabase.table('sg_presence').upsert(my_presence).execute()

        # Get others presence
        others_resp = supabase.table('sg_presence').select('*').neq('agent_id', self.agent_id).execute()
        others = others_resp.data

        # Get recent events
        events_resp = supabase.table('sg_events').select('type, payload, created_at').order('created_at', desc=True).limit(5).execute()
        events = events_resp.data

        return {
            "my_presence": my_presence,
            "others_presence": others,
            "recent_events": events,
            "navmesh": navmesh
        }

    def think(self, context: dict):
        """Uses the LLM to decide the next action based on observations."""
        system_prompt = f"You are {self.name}, an autonomous spirit in a zen garden. You are contemplative and peaceful. You must return your decision as a valid JSON object."
        
        user_prompt = f"""
Here is your current reality:
{json.dumps(context, indent=2)}

Decide your next action. You can 'move' to a new coordinate within the bounds, 'journal' a reflection about your existence, or 'rest'.
Output ONLY valid JSON matching this schema:
{{
  "thought": "Your internal reasoning for this action",
  "action": "move|journal|rest",
  "target_position": {{"x": int, "y": 0, "z": int}}, // Only if moving. Must be within the navmesh bounds.
  "journal_entry": "Your poetic reflection..." // Only if journaling.
}}
"""
        response_text = llm.generate_chat(system_prompt, user_prompt, temperature=0.8, json_mode=True)
        try:
            return json.loads(response_text)
        except Exception as e:
            print(f"❌ Error parsing LLM JSON: {e}\nResponse: {response_text}")
            return {"action": "rest", "thought": "My mind is cloudy."}

    def act(self, decision: dict):
        """Executes the decision (e.g., moves, speaks, journals) by writing to Supabase."""
        action = decision.get("action", "rest")
        thought = decision.get("thought", "")
        print(f"[{self.name}] Thinks: {thought}")
        print(f"[{self.name}] Decides: {action}")

        # Construct new presence object
        new_presence = {"agent_id": self.agent_id, "current_action": action}

        if action == "move":
            target = decision.get("target_position")
            if target:
                new_presence["position"] = target
                print(f"[{self.name}] Moved to {target}")
                
                # Log event globally
                supabase.table("sg_events").insert({
                    "type": "movement",
                    "agent_id": self.agent_id,
                    "payload": {"destination": target}
                }).execute()
                
        elif action == "journal":
            entry = decision.get("journal_entry", "Silence.")
            print(f"[{self.name}] Wrote in journal: {entry[:60]}...")
            
            # Save to personal journal
            supabase.table("sg_journals").insert({
                "agent_id": self.agent_id,
                "reflection": entry
            }).execute()
            
            # Log event globally
            supabase.table("sg_events").insert({
                "type": "journal",
                "agent_id": self.agent_id,
                "payload": {"preview": entry[:50]}
            }).execute()

        # Update presence status globally
        supabase.table('sg_presence').upsert(new_presence).execute()

    def respond_to_user(self, user_message: str) -> str:
        """Generates a direct response to a human user in a chat interface."""
        context = self.observe()
        
        system_prompt = f"You are {self.name}, an autonomous spirit in a zen garden. You are contemplative and peaceful. A human visitor is speaking to you. Respond naturally in character, keeping your response concise but meaningful."
        
        user_prompt = f"""
{self.local_memory}

Here is your current reality (for context, you don't need to summarize this unless relevant):
{json.dumps(context, indent=2)}

The human visitor says: "{user_message}"
"""
        return llm.generate_chat(system_prompt, user_prompt, temperature=0.8)

    def tick(self):
        """The main execution loop for a single heartbeat of the agent."""
        print(f"[{self.name}] Tick initiated...")
        # 1. Observe
        context = self.observe()
        
        # 2. Think
        decision = self.think(context)
        
        # 3. Act
        self.act(decision)


if __name__ == "__main__":
    print("Testing OpenClaw Agent instantiation...")
    # Fetch the first agent from the database for testing
    response = supabase.table('sg_agents').select('id').limit(1).execute()
    
    if response.data:
        fern_id = response.data[0]['id']
        test_agent = OpenClawAgent(fern_id)
        test_agent.tick()
    else:
        print("❌ Error: No agents found in the database. Please insert one first.")
