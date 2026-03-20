import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from the root .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

print("Initializing OpenClaw LLM Link Test...")

# Initialize the OpenAI client
# The user specified they are using the OpenAI Codex 5,3 model (gpt-4o / gpt-3.5-turbo equivalent through their sub)
def test_llm_connection():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
         print("❌ Error: OPENAI_API_KEY is not set in the root .env file. Please add it to test the connection.")
         return

    try:
        # Initialize the OpenAI client here so it doesn't crash on import if the key is missing
        client = OpenAI(api_key=api_key)

        print("Sending test payload to LLM...")
        response = client.chat.completions.create(
            model="gpt-4o-mini", # Using a fast model for the connection test
            messages=[
                {"role": "system", "content": "You are a zen garden spirit. Respond with exactly one short, peaceful sentence."},
                {"role": "user", "content": "Are you there?"}
            ],
            max_tokens=50
        )
        
        reply = response.choices[0].message.content
        print(f"✅ Success! The spirit replied: '{reply}'")
        
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    test_llm_connection()
