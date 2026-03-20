import os
from openai import OpenAI
from dotenv import load_dotenv

# Ensure environment variables are loaded from the root .env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

class LLMClient:
    """
    A robust wrapper for the OpenAI API.
    Handles Chat Completions (Agent logic) and Embeddings (pgvector memory).
    """
    def __init__(self):
        self.api_key = os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            print("⚠️ WARNING: OPENAI_API_KEY is missing. LLMClient will fail.")
            
        self.client = OpenAI(api_key=self.api_key)
        
        # The user uses Codex 5,3 subscription, which gives access to standard models
        self.default_chat_model = "gpt-4o" 
        self.default_embedding_model = "text-embedding-3-small"

    def generate_chat(self, system_prompt: str, user_prompt: str, temperature: float = 0.7, json_mode: bool = False) -> str:
        """Generates a standard chat completion."""
        try:
            kwargs = {
                "model": self.default_chat_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": temperature
            }
            
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}
                
            response = self.client.chat.completions.create(**kwargs)
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"❌ LLM Chat Error: {e}")
            return None

    def generate_embedding(self, text: str) -> list[float]:
        """Generates a 1536-dimensional vector embedding for pgvector storage."""
        try:
            response = self.client.embeddings.create(
                model=self.default_embedding_model,
                input=text
            )
            return response.data[0].embedding
            
        except Exception as e:
            print(f"❌ LLM Embedding Error: {e}")
            return None

# Singleton export
llm = LLMClient()
