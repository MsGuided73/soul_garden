"""
Agent API Routes
CRUD and lifecycle endpoints for agents.
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import AsyncClient as SupabaseClient

from app.db.database import get_db
from app.models.agent import Agent, AgentCreate, AgentStatus, AgentSummary, AgentUpdate
from app.services.agent_service import get_agent_service
from app.services.identity_service import get_identity_service

router = APIRouter()


@router.post("", response_model=Agent, status_code=status.HTTP_201_CREATED)
async def create_agent(
    agent_create: AgentCreate,
    db: SupabaseClient = Depends(get_db)
) -> Agent:
    """Create a new agent with identity files."""
    service = get_agent_service()
    
    # Check handle uniqueness
    existing = await service.get_agent_by_handle(db, agent_create.handle)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Agent with handle '{agent_create.handle}' already exists"
        )
    
    return await service.create_agent(db, agent_create)


@router.get("", response_model=List[AgentSummary])
async def list_agents(
    garden_id: Optional[UUID] = None,
    status: Optional[AgentStatus] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: SupabaseClient = Depends(get_db)
) -> List[AgentSummary]:
    """List agents with optional filtering."""
    service = get_agent_service()
    return await service.list_agents(db, garden_id, status, limit, offset)


@router.get("/{agent_id}", response_model=Agent)
async def get_agent(
    agent_id: UUID,
    db: SupabaseClient = Depends(get_db)
) -> Agent:
    """Get agent by ID."""
    service = get_agent_service()
    agent = await service.get_agent(db, agent_id)
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found"
        )
    
    return agent


@router.get("/handle/{handle}", response_model=Agent)
async def get_agent_by_handle(
    handle: str,
    db: SupabaseClient = Depends(get_db)
) -> Agent:
    """Get agent by handle."""
    service = get_agent_service()
    agent = await service.get_agent_by_handle(db, handle)
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with handle '{handle}' not found"
        )
    
    return agent


@router.patch("/{agent_id}", response_model=Agent)
async def update_agent(
    agent_id: UUID,
    update: AgentUpdate,
    db: SupabaseClient = Depends(get_db)
) -> Agent:
    """Update agent fields."""
    service = get_agent_service()
    
    # Check agent exists
    existing = await service.get_agent(db, agent_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found"
        )
    
    updated = await service.update_agent(db, agent_id, update)
    return updated


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    agent_id: UUID,
    db: SupabaseClient = Depends(get_db)
) -> None:
    """Delete an agent and all associated data."""
    service = get_agent_service()
    
    # Check agent exists
    existing = await service.get_agent(db, agent_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found"
        )
    
    success = await service.delete_agent(db, agent_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete agent"
        )


@router.get("/{agent_id}/identity")
async def get_agent_identity(
    agent_id: UUID,
    db: SupabaseClient = Depends(get_db)
) -> dict:
    """Get agent's identity files (LORE, SOUL, IDENTITY, DRIFT_LOG)."""
    # Check agent exists
    service = get_agent_service()
    agent = await service.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found"
        )
    
    identity_service = get_identity_service()
    files = await identity_service.read_identity_files(agent_id)
    
    return {
        "lore": files.lore,
        "soul": files.soul,
        "identity": files.identity,
        "drift_log": files.drift_log
    }


@router.post("/{agent_id}/wake")
async def wake_agent(
    agent_id: UUID,
    db: SupabaseClient = Depends(get_db)
) -> dict:
    """Wake an agent from dormant state."""
    service = get_agent_service()
    
    agent = await service.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found"
        )
    
    if agent.status == AgentStatus.ACTIVE:
        return {"status": "already_active", "agent_id": str(agent_id)}
    
    updated = await service.update_agent(
        db, 
        agent_id, 
        AgentUpdate(status=AgentStatus.ACTIVE)
    )
    
    return {
        "status": "awakened",
        "agent_id": str(agent_id),
        "previous_status": agent.status.value
    }


@router.post("/{agent_id}/sleep")
async def sleep_agent(
    agent_id: UUID,
    db: SupabaseClient = Depends(get_db)
) -> dict:
    """Put an agent to sleep (dormant state)."""
    service = get_agent_service()
    
    agent = await service.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found"
        )
    
    if agent.status == AgentStatus.DORMANT:
        return {"status": "already_dormant", "agent_id": str(agent_id)}
    
    updated = await service.update_agent(
        db,
        agent_id,
        AgentUpdate(status=AgentStatus.DORMANT)
    )
    
    return {
        "status": "put_to_sleep",
        "agent_id": str(agent_id),
        "previous_status": agent.status.value
    }
