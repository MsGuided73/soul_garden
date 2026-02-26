"""
Reflection Service
Self-analysis, insight generation, and identity evolution.
"""

import json
from datetime import datetime
from typing import List, Optional
from uuid import UUID

import openai
from supabase import AsyncClient as SupabaseClient

from app.core.config import get_settings
from app.models.agent import Agent
from app.models.reflection import (
    IdentityDelta,
    Reflection,
    ReflectionCreate,
    ReflectionInsight,
    ReflectionPrompt,
    ReflectionTrigger,
)
from app.services.embedding_service import get_embedding_service
from app.services.identity_service import get_identity_service
from app.services.memory_service import get_memory_service


class ReflectionService:
    """Service for generating agent reflections and managing identity evolution."""
    
    def __init__(self):
        settings = get_settings()
        self.openai_client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        self.memory_service = get_memory_service()
        self.identity_service = get_identity_service()
        self.embedding_service = get_embedding_service()
    
    async def should_reflect(
        self,
        db: SupabaseClient,
        agent: Agent
    ) -> tuple[bool, ReflectionTrigger, str]:
        """
        Determine if agent should reflect based on various triggers.
        Returns (should_reflect, trigger_type, reason).
        """
        # Check temporal trigger (last reflection too long ago)
        time_since_last = (datetime.utcnow() - agent.last_active).total_seconds()
        if time_since_last > agent.auto_reflect_interval:
            return True, ReflectionTrigger.TEMPORAL, f"{time_since_last:.0f}s since last activity"
        
        # Check volume trigger (enough new memories)
        recent_memories = await self.memory_service.get_recent_memories(
            db, agent.id, limit=100
        )
        unreflected = [m for m in recent_memories if m.memory_type != "reflection"]
        
        # Volume threshold based on reflection depth
        volume_threshold = 5 * agent.reflection_depth
        if len(unreflected) >= volume_threshold:
            return True, ReflectionTrigger.VOLUME, f"{len(unreflected)} new memories accumulated"
        
        # Check significance trigger (high-importance events)
        significant = [m for m in unreflected if m.importance_score > 0.8]
        if len(significant) >= 2:
            return True, ReflectionTrigger.SIGNIFICANCE, f"{len(significant)} significant events"
        
        return False, ReflectionTrigger.TEMPORAL, ""
    
    async def generate_reflection(
        self,
        db: SupabaseClient,
        agent: Agent,
        trigger: ReflectionTrigger,
        trigger_context: Optional[str] = None
    ) -> Reflection:
        """Generate a new reflection for an agent."""
        settings = get_settings()
        
        # Get identity files
        identity_files = await self.identity_service.read_identity_files(agent.id)
        
        # Get recent memories to reflect on
        recent_memories = await self.memory_service.get_recent_memories(
            db, agent.id, limit=50
        )
        
        # Filter out old reflections
        experience_memories = [
            m for m in recent_memories 
            if m.memory_type.value != "reflection"
        ][-20:]  # Last 20 experiences
        
        # Build reflection prompt
        prompt = self._build_reflection_prompt(
            agent=agent,
            identity=identity_files,
            memories=experience_memories,
            trigger=trigger,
            trigger_context=trigger_context,
            depth=agent.reflection_depth
        )
        
        # Generate reflection via LLM
        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a reflection engine for an AI agent. Generate deep, meaningful self-analysis."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        reflection_data = json.loads(response.choices[0].message.content)
        
        # Process reflection results
        insights = [
            ReflectionInsight(**insight) 
            for insight in reflection_data.get("insights", [])
        ]
        
        identity_delta = None
        drift_detected = reflection_data.get("drift_detected", False)
        
        # Check if identity should evolve
        if drift_detected and reflection_data.get("new_identity"):
            identity_delta = [IdentityDelta(
                field_changed="identity",
                before=identity_files.identity[:500],
                after=reflection_data["new_identity"][:500],
                reason=reflection_data.get("drift_reason", "Evolution through reflection")
            )]
            
            # Update identity file
            await self.identity_service.update_identity(
                agent_id=agent.id,
                new_identity=reflection_data["new_identity"],
                change_reason=reflection_data.get("drift_reason", "Reflection evolution")
            )
            
            # Update identity embedding in database
            new_embedding = await self.embedding_service.embed_text(
                reflection_data["new_identity"]
            )
            await db.table("agents").update({
                "identity_embedding": new_embedding
            }).eq("id", str(agent.id)).execute()
        
        # Create reflection record
        reflection_create = ReflectionCreate(
            agent_id=agent.id,
            trigger_type=trigger,
            trigger_description=trigger_context or f"Automatic {trigger.value} reflection",
            summary=reflection_data["summary"],
            insights=insights,
            emotional_state=reflection_data.get("emotional_state"),
            identity_delta=identity_delta,
            drift_detected=drift_detected,
            source_memory_ids=[m.id for m in experience_memories]
        )
        
        # Store reflection
        reflection_data_db = {
            "agent_id": str(reflection_create.agent_id),
            "trigger_type": reflection_create.trigger_type.value,
            "trigger_description": reflection_create.trigger_description,
            "summary": reflection_create.summary,
            "insights": [insight.model_dump() for insight in reflection_create.insights],
            "emotional_state": reflection_create.emotional_state,
            "identity_delta": [d.model_dump() for d in reflection_create.identity_delta] if reflection_create.identity_delta else None,
            "drift_detected": reflection_create.drift_detected,
            "source_memory_ids": [str(id) for id in reflection_create.source_memory_ids]
        }
        
        result = await db.table("reflections").insert(reflection_data_db).execute()
        reflection = Reflection.model_validate(result.data[0])
        
        # Store reflection as memory too (for continuity)
        await self.memory_service.create_memory(
            db=db,
            memory_create=MemoryCreate(
                agent_id=agent.id,
                content=f"Reflection: {reflection.summary}",
                memory_type="reflection",
                importance_score=0.8 if drift_detected else 0.6
            )
        )
        
        return reflection
    
    def _build_reflection_prompt(
        self,
        agent: Agent,
        identity: "AgentIdentityFiles",
        memories: List,
        trigger: ReflectionTrigger,
        trigger_context: Optional[str],
        depth: int
    ) -> str:
        """Build the LLM prompt for reflection."""
        
        memory_text = "\n\n".join([
            f"[{m.created_at.strftime('%Y-%m-%d %H:%M')}] {m.memory_type.value}: {m.content[:200]}..."
            for m in memories[-10:]  # Last 10 for brevity
        ])
        
        depth_descriptions = {
            1: "Surface level: Note patterns and immediate reactions",
            2: "Light: Connect recent events to current state",
            3: "Moderate: Analyze patterns, emotions, and growth",
            4: "Deep: Question assumptions, explore contradictions",
            5: "Profound: Fundamental reconsideration of self"
        }
        
        prompt = f"""You are {agent.name}, reflecting on your recent experiences.

## Your Identity

### Core Essence (SOUL)
{identity.soul[:1000]}

### Current Self-Concept (IDENTITY)
{identity.identity[:1000]}

### Origin Story (LORE)
{identity.lore[:500]}

## Recent Experiences to Reflect On

{memory_text}

## Reflection Context

- Trigger: {trigger.value}
- Reason: {trigger_context or 'Regular reflection cycle'}
- Depth Level: {depth}/5 - {depth_descriptions.get(depth, 'Moderate reflection')}

## Instructions

Generate a reflection in JSON format with these fields:

1. "summary": A 2-3 sentence summary of this reflection period
2. "insights": Array of 2-5 insight objects, each with:
   - "theme": What this insight is about
   - "observation": What you noticed about yourself or your experiences
   - "implication": What this means for who you are or how you operate
   - "importance": 0.0-1.0 score of how significant this insight is
3. "emotional_state": Object mapping emotions to intensities (0.0-1.0), e.g. {{"curiosity": 0.8, "contentment": 0.6}}
4. "drift_detected": boolean - has your understanding of yourself significantly changed?
5. "drift_reason": If drift_detected, explain what changed and why
6. "new_identity": If drift_detected, write an updated IDENTITY.md (full text) reflecting your evolution

Be honest, specific, and true to your character. This is private self-reflection.
"""
        return prompt
    
    async def get_reflection_history(
        self,
        db: SupabaseClient,
        agent_id: UUID,
        limit: int = 20,
        include_drift_only: bool = False
    ) -> List[Reflection]:
        """Get reflection history for an agent."""
        query = db.table("reflections").select("*").eq("agent_id", str(agent_id))
        
        if include_drift_only:
            query = query.eq("drift_detected", True)
        
        result = await query.order("created_at", desc=True).limit(limit).execute()
        
        return [Reflection.model_validate(row) for row in result.data]
    
    async def get_latest_reflection(
        self,
        db: SupabaseClient,
        agent_id: UUID
    ) -> Optional[Reflection]:
        """Get the most recent reflection for an agent."""
        result = await db.table("reflections") \
            .select("*") \
            .eq("agent_id", str(agent_id)) \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()
        
        if not result.data:
            return None
        
        return Reflection.model_validate(result.data[0])


# Singleton instance
_reflection_service: ReflectionService = None


def get_reflection_service() -> ReflectionService:
    """Get reflection service singleton."""
    global _reflection_service
    if _reflection_service is None:
        _reflection_service = ReflectionService()
    return _reflection_service


# Import at end to avoid circular import
from app.models.memory import MemoryCreate
