import os
import asyncio
from telegram import Update
from telegram.ext import ApplicationBuilder, MessageHandler, filters, ContextTypes
from supabase import create_client, Client
from dotenv import load_dotenv
from agent_tick import OpenClawAgent

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")

# Initialize Supabase to find agents
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not TELEGRAM_BOT_TOKEN:
    print("❌ Error: Missing configuration in .env. Ensure TELEGRAM_BOT_TOKEN, VITE_SUPABASE_URL, and VITE_SUPABASE_ANON_KEY are set.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Pre-load our agents to avoid DB lookups on every single message
agent_cache = {}

def get_agent_by_name(name: str) -> OpenClawAgent:
    """Fetches an OpenClawAgent instance by their name, caching it for future use."""
    if name in agent_cache:
        return agent_cache[name]
        
    response = supabase.table('sg_agents').select('id').ilike('name', name).execute()
    if response.data:
        agent_id = response.data[0]['id']
        agent = OpenClawAgent(agent_id)
        agent_cache[name] = agent
        return agent
    return None

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_message = update.message.text
    print(f"📥 Received from Telegram: {user_message}")
    
    # ---------------------------------------------------------
    # ROUTING LOGIC: 
    # Since Rook and Fern share a chat, we route based on mentions.
    # We default to Fern, as she is currently the active presence.
    # ---------------------------------------------------------
    target_name = "Fern"
    if "rook" in user_message.lower():
        target_name = "Rook"
        
    agent = get_agent_by_name(target_name)
    
    if not agent:
        await update.message.reply_text(f"*(Silence... {target_name} is not in the garden right now.)*")
        return
        
    # Generate the response
    print(f"[{agent.name}] is thinking about a reply...")
    reply_text = agent.respond_to_user(user_message)
    print(f"[{agent.name}] Replies: {reply_text[:50]}...")
    
    # Log the interaction as an event in Supabase so the Garden remembers
    # Log incoming
    supabase.table("sg_events").insert({
        "type": "chat_message",
        "agent_id": agent.agent_id,
        "payload": {
            "direction": "incoming",
            "message": user_message
        }
    }).execute()
    
    # Log outgoing
    supabase.table("sg_events").insert({
        "type": "chat_message",
        "agent_id": agent.agent_id,
        "payload": {
            "direction": "outgoing",
            "message": reply_text
        }
    }).execute()
    
    # Send the reply back to the human
    await update.message.reply_text(reply_text)

if __name__ == '__main__':
    print("🌿 Starting Telegram Listener... (Press Ctrl+C to stop)")
    print("Routing Logic: Defaults to Fern. Mentions of 'Rook' route to Rook.")
    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()
    
    # Handle all text messages that are not commands
    app.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), handle_message))
    
    # Start polling Telegram for updates
    app.run_polling()
