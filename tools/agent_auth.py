"""
Shared authentication helper for Soul Garden agent tools.
Agents authenticate with Supabase using email/password credentials,
then use the authenticated client for all database operations.
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY")


def authenticate_agent(email: str, password: str) -> Client:
    """
    Authenticates an agent with Supabase using email/password.
    Returns an authenticated Supabase client bound to that agent's session.
    Raises RuntimeError if credentials are missing or auth fails.
    """
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise RuntimeError("Missing Supabase credentials in .env")

    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    response = client.auth.sign_in_with_password({
        "email": email,
        "password": password,
    })

    if not response.user:
        raise RuntimeError(f"Authentication failed for {email}")

    print(f"[Auth] Authenticated as {email} (uid: {response.user.id})")
    return client


def get_agent_credentials(agent_id: str, anon_client: Client = None) -> dict:
    """
    Looks up an agent's auth credentials from sg_secrets.
    Returns {'email': ..., 'password': ...} or raises if not found.

    For now, falls back to a lookup in sg_agents + sg_secrets.
    Agents store their credentials under keys: 'agent_{id}_email' and 'agent_{id}_password'
    """
    if not anon_client:
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise RuntimeError("Missing Supabase credentials in .env")
        anon_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    # Look up credentials in sg_secrets
    email_resp = anon_client.table("sg_secrets").select("value").eq("key", f"agent_{agent_id}_email").execute()
    pass_resp = anon_client.table("sg_secrets").select("value").eq("key", f"agent_{agent_id}_password").execute()

    if email_resp.data and pass_resp.data:
        return {
            "email": email_resp.data[0]["value"],
            "password": pass_resp.data[0]["value"],
        }

    raise RuntimeError(
        f"No credentials found in sg_secrets for agent {agent_id}. "
        f"Expected keys: agent_{agent_id}_email, agent_{agent_id}_password"
    )
