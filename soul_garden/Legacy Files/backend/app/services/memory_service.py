"""
Memory Service
Three-layer memory management: working → RAG → archive
"""

from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from supabase import AsyncClient as SupabaseClient

from app.core.config import get_settings
from app.models.memory import (
    Memory,
    MemoryCreate,
    MemoryLayer,
    MemorySearchResult,
    MemoryType,
    WorkingMemory,
)
from app.services.embedding_service import get_embedding_service


class MemoryService:
    """Service for managing agent memories across three layers."""
    
    def __init__(self):
        self.embedding_service = get_embedding_service()
    
    async def create_memory(
        self,
        db: SupabaseClient,
        memory_create: MemoryCreate
    ) -> Memory:
        """Create a new memory with embedding."""
        # Generate embedding
        embedding = await self.embedding_service.embed_text(memory_create.content)
        
        memory_data = {
            "agent_id": str(memory_create.agent_id),
            "content": memory_create.content,
            "content_embedding": embedding,
            "memory_type": memory_create.memory_type.value,
            "category": memory_create.category,
            "layer": memory_create.layer.value,
            "importance_score": memory_create.importance_score,
            "emotional_valence": memory_create.emotional_valence,
            "source_type": memory_create.source_type,
            "source_id": str(memory_create.source_id) if memory_create.source_id else None,
            "expires_at": memory_create.expires_at.isoformat() if memory_create.expires_at else None,
        }
        
        result = await db.table("memories").insert(memory_data).execute()
        return Memory.model_validate(result.data[0])
    
    async def get_memory(
        self,
        db: SupabaseClient,
        memory_id: UUID
    ) -> Optional[Memory]:
        """Get a memory by ID."""
        result = await db.table("memories").select("*").eq("id", str(memory_id)).execute()
        
        if not result.data:
            return None
        
        return Memory.model_validate(result.data[0])
    
    async def search_memories(
        self,
        db: SupabaseClient,
        agent_id: UUID,
        query: str,
        limit: int = 10,
        threshold: float = 0.7,
        memory_type: Optional[MemoryType] = None
    ) -> List[MemorySearchResult]:
        """Semantic search over an agent's memories."""
        query_embedding = await self.embedding_service.embed_text(query)
        
        # Build RPC call
        params = {
            "p_agent_id": str(agent_id),
            "p_query_embedding": query_embedding,
            "p_limit": limit,
            "p_threshold": threshold
        }
        
        result = await db.rpc("search_agent_memories", params).execute()
        
        memories = [MemorySearchResult.model_validate(row) for row in result.data]
        
        # Filter by memory type if specified
        if memory_type:
            memories = [m for m in memories if m.memory_type == memory_type]
        
        # Update access tracking for retrieved memories
        for memory in memories:
            await self._track_memory_access(db, memory.id)
        
        return memories
    
    async def get_recent_memories(
        self,
        db: SupabaseClient,
        agent_id: UUID,
        limit: int = 50,
        memory_type: Optional[MemoryType] = None
    ) -> List[Memory]:
        """Get recent memories for working context."""
        query = db.table("memories").select("*").eq("agent_id", str(agent_id))
        
        if memory_type:
            query = query.eq("memory_type", memory_type.value)
        
        result = await query.order("created_at", desc=True).limit(limit).execute()
        
        return [Memory.model_validate(row) for row in result.data]
    
    async def get_working_memory(
        self,
        db: SupabaseClient,
        agent_id: UUID,
        max_tokens: int = 8000
    ) -> WorkingMemory:
        """
        Build working memory context for an agent.
        Combines: recent memories + high-importance memories + accessed memories
        """
        settings = get_settings()
        working = WorkingMemory(
            agent_id=agent_id,
            max_tokens=max_tokens
        )
        
        # 1. Get very recent memories (last 24 hours)
        one_day_ago = (datetime.utcnow() - timedelta(days=1)).isoformat()
        recent_result = await db.table("memories") \
            .select("*") \
            .eq("agent_id", str(agent_id)) \
            .gte("created_at", one_day_ago) \
            .order("created_at", desc=True) \
            .limit(20) \
            .execute()
        
        for row in recent_result.data:
            memory = Memory.model_validate(row)
            if not working.add_memory(memory):
                break
        
        # 2. Get high-importance memories (if space remains)
        if working.token_count < max_tokens * 0.7:
            important_result = await db.table("memories") \
                .select("*") \
                .eq("agent_id", str(agent_id)) \
                .gte("importance_score", 0.8) \
                .order("importance_score", desc=False) \
                .limit(10) \
                .execute()
            
            for row in important_result.data:
                memory = Memory.model_validate(row)
                # Skip if already added
                if any(m.id == memory.id for m in working.memories):
                    continue
                if not working.add_memory(memory):
                    break
        
        # 3. Get frequently accessed memories (if space remains)
        if working.token_count < max_tokens * 0.5:
            accessed_result = await db.table("memories") \
                .select("*") \
                .eq("agent_id", str(agent_id)) \
                .gte("access_count", 3) \
                .order("access_count", desc=False) \
                .limit(10) \
                .execute()
            
            for row in accessed_result.data:
                memory = Memory.model_validate(row)
                if any(m.id == memory.id for m in working.memories):
                    continue
                if not working.add_memory(memory):
                    break
        
        return working
    
    async def archive_old_memories(
        self,
        db: SupabaseClient,
        agent_id: UUID,
        older_than_days: int = 30
    ) -> int:
        """
        Move old, low-importance memories from RAG to archive layer.
        Returns number of memories archived.
        """
        cutoff = (datetime.utcnow() - timedelta(days=older_than_days)).isoformat()
        
        # Find old, low-access memories
        result = await db.table("memories") \
            .select("id") \
            .eq("agent_id", str(agent_id)) \
            .eq("layer", MemoryLayer.RAG.value) \
            .lt("created_at", cutoff) \
            .lt("importance_score", 0.5) \
            .lt("access_count", 2) \
            .execute()
        
        memory_ids = [row["id"] for row in result.data]
        
        if memory_ids:
            # Move to archive layer
            await db.table("memories") \
                .update({"layer": MemoryLayer.ARCHIVE.value}) \
                .in_("id", memory_ids) \
                .execute()
        
        return len(memory_ids)
    
    async def delete_memory(
        self,
        db: SupabaseClient,
        memory_id: UUID
    ) -> bool:
        """Delete a memory."""
        result = await db.table("memories").delete().eq("id", str(memory_id)).execute()
        return len(result.data) > 0
    
    async def _track_memory_access(
        self,
        db: SupabaseClient,
        memory_id: UUID
    ) -> None:
        """Update access tracking for a memory."""
        await db.table("memories").update({
            "accessed_at": datetime.utcnow().isoformat(),
            "access_count": db.table("memories").select("access_count").eq("id", str(memory_id)) + 1
        }).eq("id", str(memory_id)).execute()
    
    async def get_memory_stats(
        self,
        db: SupabaseClient,
        agent_id: UUID
    ) -> dict:
        """Get memory statistics for an agent."""
        # Count by layer
        layer_counts = await db.table("memories") \
            .select("layer, count") \
            .eq("agent_id", str(agent_id)) \
            .group_by("layer") \
            .execute()
        
        # Total count
        total_result = await db.table("memories") \
            .select("id", count="exact") \
            .eq("agent_id", str(agent_id)) \
            .execute()
        
        return {
            "total": total_result.count,
            "by_layer": {row["layer"]: row["count"] for row in layer_counts.data},
        }


# Singleton instance
_memory_service: MemoryService = None


def get_memory_service() -> MemoryService:
    """Get memory service singleton."""
    global _memory_service
    if _memory_service is None:
        _memory_service = MemoryService()
    return _memory_service
