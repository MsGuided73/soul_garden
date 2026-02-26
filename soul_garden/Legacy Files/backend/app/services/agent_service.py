"""
Agent Service
CRUD operations and agent lifecycle management.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from supabase import AsyncClient as SupabaseClient

from app.core.config import get_settings
from app.models.agent import Agent, AgentCreate, AgentStatus, AgentSummary, AgentUpdate
from app.services.embedding_service import get_embedding_service
from app.services.identity_service import get_identity_service


class AgentService:
    """Service for managing agents."""
    
    def __init__(self):
        self.embedding_service = get_embedding_service()
        self.identity_service = get_identity_service()
    
    async def create_agent(
        self,
        db: SupabaseClient,
        agent_create: AgentCreate
    ) -> Agent:
        """Create a new agent with identity files."""
        settings = get_settings()
        
        # Generate identity embedding from initial content
        identity_text = f"""
        Name: {agent_create.name}
        Handle: {agent_create.handle}
        Lore: {agent_create.lore_content or ''}
        Soul: {agent_create.soul_content or ''}
        Identity: {agent_create.identity_content or ''}
        """
        identity_embedding = await self.embedding_service.embed_text(identity_text)
        
        # Insert agent into database
        agent_data = {
            "name": agent_create.name,
            "handle": agent_create.handle,
            "status": AgentStatus.DORMANT.value,
            "reflection_depth": agent_create.reflection_depth or settings.DEFAULT_REFLECTION_DEPTH,
            "auto_reflect_interval": agent_create.auto_reflect_interval or settings.DEFAULT_AUTO_REFLECT_INTERVAL,
            "garden_id": str(agent_create.garden_id) if agent_create.garden_id else None,
            "identity_embedding": identity_embedding,
        }
        
        result = await db.table("agents").insert(agent_data).execute()
        agent_row = result.data[0]
        agent_id = UUID(agent_row["id"])
        
        # Create identity files
        file_paths = await self.identity_service.initialize_agent_files(
            agent_id=agent_id,
            name=agent_create.name,
            lore_content=agent_create.lore_content,
            soul_content=agent_create.soul_content,
            identity_content=agent_create.identity_content,
        )
        
        # Update agent with file paths
        await db.table("agents").update({
            "lore_path": file_paths["lore"],
            "soul_path": file_paths["soul"],
            "identity_path": file_paths["identity"],
            "drift_log_path": file_paths["drift_log"],
        }).eq("id", str(agent_id)).execute()
        
        # Return complete agent
        return await self.get_agent(db, agent_id)
    
    async def get_agent(
        self,
        db: SupabaseClient,
        agent_id: UUID
    ) -> Optional[Agent]:
        """Get agent by ID."""
        result = await db.table("agents").select("*").eq("id", str(agent_id)).execute()
        
        if not result.data:
            return None
        
        return Agent.model_validate(result.data[0])
    
    async def get_agent_by_handle(
        self,
        db: SupabaseClient,
        handle: str
    ) -> Optional[Agent]:
        """Get agent by handle."""
        result = await db.table("agents").select("*").eq("handle", handle).execute()
        
        if not result.data:
            return None
        
        return Agent.model_validate(result.data[0])
    
    async def list_agents(
        self,
        db: SupabaseClient,
        garden_id: Optional[UUID] = None,
        status: Optional[AgentStatus] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[AgentSummary]:
        """List agents with optional filters."""
        query = db.table("agents").select("id, name, handle, status, garden_id, created_at, last_active")
        
        if garden_id:
            query = query.eq("garden_id", str(garden_id))
        
        if status:
            query = query.eq("status", status.value)
        
        result = await query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        return [AgentSummary.model_validate(row) for row in result.data]
    
    async def update_agent(
        self,
        db: SupabaseClient,
        agent_id: UUID,
        update: AgentUpdate
    ) -> Optional[Agent]:
        """Update agent fields."""
        update_data = {}
        
        if update.name is not None:
            update_data["name"] = update.name
        
        if update.status is not None:
            update_data["status"] = update.status.value
        
        if update.reflection_depth is not None:
            update_data["reflection_depth"] = update.reflection_depth
        
        if update.auto_reflect_interval is not None:
            update_data["auto_reflect_interval"] = update.auto_reflect_interval
        
        if update.garden_id is not None:
            update_data["garden_id"] = str(update.garden_id) if update.garden_id else None
        
        if update_data:
            update_data["updated_at"] = datetime.utcnow().isoformat()
            await db.table("agents").update(update_data).eq("id", str(agent_id)).execute()
        
        return await self.get_agent(db, agent_id)
    
    async def delete_agent(
        self,
        db: SupabaseClient,
        agent_id: UUID
    ) -> bool:
        """Delete an agent and all associated data."""
        # Note: Cascading deletes in DB handle memories, reflections, etc.
        result = await db.table("agents").delete().eq("id", str(agent_id)).execute()
        return len(result.data) > 0
    
    async def update_last_active(
        self,
        db: SupabaseClient,
        agent_id: UUID
    ) -> None:
        """Update agent's last active timestamp."""
        await db.table("agents").update({
            "last_active": datetime.utcnow().isoformat()
        }).eq("id", str(agent_id)).execute()
    
    async def find_similar_agents(
        self,
        db: SupabaseClient,
        query_text: str,
        limit: int = 5
    ) -> List[AgentSummary]:
        """Find agents with similar identity embeddings."""
        query_embedding = await self.embedding_service.embed_text(query_text)
        
        # Use pgvector similarity search
        result = await db.rpc(
            "search_similar_agents",
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.7,
                "match_count": limit
            }
        ).execute()
        
        return [AgentSummary.model_validate(row) for row in result.data]


# Singleton instance
_agent_service: AgentService = None


def get_agent_service() -> AgentService:
    """Get agent service singleton."""
    global _agent_service
    if _agent_service is None:
        _agent_service = AgentService()
    return _agent_service
