"""
Reflection API Routes
Self-analysis and identity evolution endpoints.
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import AsyncClient as SupabaseClient

from app.db.database import get_db
from app.models.reflection import Reflection, ReflectionTrigger
from app.services.agent_service import get_agent_service
from app.services.reflection_service import get_reflection_service

router = APIRouter()


@router.get("/agent/{agent_id}", response_model=List[Reflection])
async def get_agent_reflections(
    agent_id: UUID,
    drift_only: bool = Query(False, description="Only return reflections with identity drift"),
    limit: int = Query(20, ge=1, le=100),
    db: SupabaseClient = Depends(get_db)
) -> List[Reflection]:
    """Get reflection history for an agent."""
    # Verify agent exists
    agent_service = get_agent_service()
    agent = await agent_service.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found"
        )
    
    service = get_reflection_service()
    return await service.get_reflection_history(db, agent_id, limit, drift_only)


@router.post("/agent/{agent_id}/reflect", response_model=Reflection)
async def trigger_reflection(
    agent_id: UUID,
    trigger: ReflectionTrigger = Query(ReflectionTrigger.EXTERNAL),
    context: Optional[str] = Query(None, description="Context for the reflection"),
    db: SupabaseClient = Depends(get_db)
) -> Reflection:
    """Manually trigger a reflection for an agent."""
    agent_service = get_agent_service()
    reflection_service = get_reflection_service()
    
    # Get agent
    agent = await agent_service.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found"
        )
    
    # Generate reflection
    reflection = await reflection_service.generate_reflection(
        db, agent, trigger, context
    )
    
    # Update agent last active
    await agent_service.update_last_active(db, agent_id)
    
    return reflection


@router.get("/agent/{agent_id}/should-reflect")
async def check_should_reflect(
    agent_id: UUID,
    db: SupabaseClient = Depends(get_db)
) -> dict:
    """Check if an agent should reflect based on triggers."""
    agent_service = get_agent_service()
    reflection_service = get_reflection_service()
    
    # Get agent
    agent = await agent_service.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found"
        )
    
    should_reflect, trigger, reason = await reflection_service.should_reflect(db, agent)
    
    return {
        "should_reflect": should_reflect,
        "trigger": trigger.value if should_reflect else None,
        "reason": reason if should_reflect else None,
        "last_active": agent.last_active.isoformat()
    }


@router.get("/{reflection_id}", response_model=Reflection)
async def get_reflection(
    reflection_id: UUID,
    db: SupabaseClient = Depends(get_db)
) -> Reflection:
    """Get a specific reflection by ID."""
    result = await db.table("reflections").select("*").eq("id", str(reflection_id)).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reflection {reflection_id} not found"
        )
    
    return Reflection.model_validate(result.data[0])


@router.get("/agent/{agent_id}/drift")
async def get_drift_history(
    agent_id: UUID,
    db: SupabaseClient = Depends(get_db)
) -> List[dict]:
    """Get identity drift history for an agent."""
    # Verify agent exists
    agent_service = get_agent_service()
    agent = await agent_service.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found"
        )
    
    # Get drift-only reflections
    reflection_service = get_reflection_service()
    drifts = await reflection_service.get_reflection_history(
        db, agent_id, limit=100, include_drift_only=True
    )
    
    return [
        {
            "id": str(r.id),
            "timestamp": r.created_at.isoformat(),
            "trigger": r.trigger_type.value,
            "summary": r.summary,
            "identity_delta": [d.model_dump() for d in r.identity_delta] if r.identity_delta else None
        }
        for r in drifts
    ]
