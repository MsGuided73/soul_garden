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
        """Fetches the agent's core identity from the Supabase database."""
        response = supabase.table('sg_agents').select('*').eq('id', self.agent_id).execute()
        if response.data:
            self.name = response.data[0].get('name', 'Unknown Spirit')
            
            # Autonomously choose a name if it hasn't been set yet
            if self.name == 'Unknown Spirit':
                self.choose_name()
            else:
                print(f"[{self.name}] Identity loaded.")
        else:
            print(f"❌ Error: Agent {self.agent_id} not found in database.")

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
        pass # To be implemented: Fetch sg_presence and sg_events

    def think(self, context: str):
        """Uses the LLM to decide the next action based on observations."""
        system_prompt = f"You are {self.name}, an autonomous spirit in a zen garden. You are contemplative and peaceful."
        user_prompt = f"Here is what you observe: {context}. What is your next thought or action?"
        
        # We will use this in the next steps
        # response = llm.generate_chat(system_prompt, user_prompt)
        # return response
        pass

    def act(self, decision: str):
        """Executes the decision (e.g., moves, speaks, journals) by writing to Supabase."""
        pass

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
