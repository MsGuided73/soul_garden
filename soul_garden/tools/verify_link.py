import os
import sys
from dotenv import load_dotenv
import requests

def verify_link():
    load_dotenv()
    
    results = {
        "OpenAI": False,
        "Supabase": False,
        "Telegram": False
    }
    
    # OpenAI Check
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        try:
            resp = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {openai_key}"},
                json={"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "hello"}], "max_tokens": 1}
            )
            if resp.status_code == 200:
                results["OpenAI"] = True
        except Exception as e:
            print(f"OpenAI Error: {e}")

    # Supabase Check
    supabase_url = os.getenv("VITE_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
    if supabase_url and supabase_key:
        try:
            resp = requests.get(f"{supabase_url}/rest/v1/", headers={"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"})
            if resp.status_code == 200:
                results["Supabase"] = True
            else:
                print(f"Supabase Status: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"Supabase Error: {e}")

    # Telegram Check
    telegram_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if telegram_token:
        try:
            resp = requests.get(f"https://api.telegram.org/bot{telegram_token}/getMe")
            if resp.status_code == 200:
                results["Telegram"] = True
            else:
                print(f"Telegram Status: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"Telegram Error: {e}")

    for service, status in results.items():
        print(f"{service}: {'✅' if status else '❌'}")
    
    if not all(results.values()):
        sys.exit(1)

if __name__ == "__main__":
    verify_link()
