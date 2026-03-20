"""
Soul Garden Database Layer
Supabase client and database operations.
"""

from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator, Dict, List, Optional
from uuid import UUID

from supabase import AsyncClient as SupabaseClient
from supabase import create_async_client

from app.core.config import get_settings


class Database:
    """Supabase database client singleton."""
    
    _instance: Optional[SupabaseClient] = None
    
    @classmethod
    async def get_client(cls) -> SupabaseClient:
        """Get or create Supabase client."""
        if cls._instance is None:
            settings = get_settings()
            cls._instance = await create_async_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_KEY
            )
        return cls._instance
    
    @classmethod
    async def close(cls) -> None:
        """Close database connection."""
        cls._instance = None


async def get_db() -> SupabaseClient:
    """Dependency for FastAPI to get database client."""
    return await Database.get_client()


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[SupabaseClient, None]:
    """Context manager for database operations."""
    client = await Database.get_client()
    try:
        yield client
    finally:
        pass  # Connection pooling handles cleanup


def format_vector(vector: List[float]) -> str:
    """Format Python list as PostgreSQL vector string."""
    return f"[{','.join(str(x) for x in vector)}]"
