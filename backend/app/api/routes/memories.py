"""
Memory API Routes
Three-layer memory system endpoints.
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import AsyncClient as SupabaseClient

from app.db.database import get_db
from app.models.memory import Memory, MemoryCreate, MemoryLayer, MemorySearchResult, MemoryType, WorkingMemory
from app.services.agent_service import get_agent_service
from app.services.memory_service import get_memory_service

router = APIRouter()


@router.post("", response_model=Memory, status_code=status.HTTP_201_CREATED)
async def create_memory(
    memory_create: MemoryCreate,
    db: SupabaseClient = Depends(get_db)
) -> Memory:
    """Create a new memory for an agent."""
    # Verify agent exists
    agent_service = get_agent_service()
    agent = await agent_service.get_agent(db, memory_create.agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {memory_create.agent_id} not found"
        )
    
    service = get_memory_service()
    return await service.create_memory(db, memory_create)


@router.get("/agent/{agent_id}", response_model=List[Memory])
async def get_agent_memories(
    agent_id: UUID,
    layer: Optional[MemoryLayer] = None,
    memory_type: Optional[MemoryType] = None,
    limit: int = Query(50, ge=1, le=200),
    db: SupabaseClient = Depends(get_db)
) -> List[Memory]:
    """Get memories for an agent with optional filtering."""
    # Verify agent exists
    agent_service = get_agent_service()
    agent = await agent_service.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found"
        )
    
    query = db.table("memories").select("*").eq("agent_id", str(agent_id))
    
    if layer:
        query = query.eq("layer", layer.value)
    
    if memory_type:
        query = query.eq("memory_type", memory_type.value)
    
    result = await query.order("created_at", desc=True).limit(limit).execute()
    return [Memory.model_validate(row) for row in result.data]


@router.get("/agent/{agent_id}/search", response_model=List[MemorySearchResult])
async def search_memories(
    agent_id: UUID,
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
    threshold: float = Query(0.7, ge=0.0, le=1.0),
    db: SupabaseClient = Depends(get_db)
) -> List[MemorySearchResult]:
    """Semantic search over an agent's memories."""
    # Verify agent exists
    agent_service = get_agent_service()
    agent = await agent_service.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found"
        )
    
    service = get_memory_service()
    return await service.search_memories(db, agent_id, q, limit, threshold)


@router.get("/agent/{agent_id}/working", response_model=WorkingMemory)
async def get_working_memory(
    agent_id: UUID,
    max_tokens: int = Query(8000, ge=1000, le=16000),
    db: SupabaseClient = Depends(get_db)
) -> WorkingMemory:
    """Get working memory context for an agent."""
    # Verify agent exists
    agent_service = get_agent_service()
    agent = await agent_service.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found"
        )
    
    service = get_memory_service()
    return await service.get_working_memory(db, agent_id, max_tokens)


@router.get("/{memory_id}", response_model=Memory)
async def get_memory(
    memory_id: UUID,
    db: SupabaseClient = Depends(get_db)
) -> Memory:
    """Get a specific memory by ID."""
    service = get_memory_service()
    memory = await service.get_memory(db, memory_id)
    
    if not memory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Memory {memory_id} not found"
        )
    
    return memory


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_memory(
    memory_id: UUID,
    db: SupabaseClient = Depends(get_db)
) -> None:
    """Delete a memory."""
    service = get_memory_service()
    
    # Check memory exists
    existing = await service.get_memory(db, memory_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Memory {memory_id} not found"
        )
    
    success = await service.delete_memory(db, memory_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete memory"
        )
