"""
Reflection Models
Self-analysis and identity evolution tracking.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ReflectionTrigger(str, Enum):
    """What caused an agent to reflect."""
    TEMPORAL = "temporal"           # Scheduled reflection (e.g., nightly)
    VOLUME = "volume"               # Accumulated enough new memories
    SIGNIFICANCE = "significance"   # High-importance event occurred
    EXTERNAL = "external"           # User or system requested reflection
    SOCIAL = "social"               # After meaningful agent interaction
    DRIFT = "drift"                 # Detected personality inconsistency


class ReflectionInsight(BaseModel):
    """A single insight from reflection."""
    
    theme: str = Field(..., description="What this insight is about")
    observation: str = Field(..., description="What the agent noticed")
    implication: str = Field(..., description="What this means for the agent")
    importance: float = Field(default=0.5, ge=0.0, le=1.0)


class IdentityDelta(BaseModel):
    """Changes to identity resulting from reflection."""
    
    field_changed: str = Field(..., description="Which aspect of identity changed")
    before: str = Field(..., description="Previous state")
    after: str = Field(..., description="New state")
    reason: str = Field(..., description="Why this change occurred")


class ReflectionBase(BaseModel):
    """Base reflection attributes."""
    trigger_type: ReflectionTrigger
    trigger_description: Optional[str] = None


class ReflectionCreate(ReflectionBase):
    """Model for creating a reflection (internal use)."""
    agent_id: UUID
    summary: str
    insights: List[ReflectionInsight]
    emotional_state: Optional[Dict[str, float]] = None
    identity_delta: Optional[List[IdentityDelta]] = None
    drift_detected: bool = False
    source_memory_ids: List[UUID] = Field(default_factory=list)


class Reflection(ReflectionBase):
    """Full reflection model as stored in database."""
    
    id: UUID
    agent_id: UUID
    created_at: datetime
    
    # Content
    summary: str
    insights: List[ReflectionInsight]
    emotional_state: Optional[Dict[str, float]] = None
    
    # Evolution tracking
    identity_delta: Optional[List[IdentityDelta]] = None
    drift_detected: bool = False
    
    # Source memories that contributed
    source_memory_ids: List[UUID]
    
    model_config = {"from_attributes": True}


class ReflectionPrompt(BaseModel):
    """Input for generating a reflection."""
    
    agent_id: UUID
    memories: List[Dict[str, Any]]  # Recent memories to reflect on
    current_identity: str
    reflection_depth: int = Field(default=3, ge=1, le=5)
    trigger: ReflectionTrigger
    trigger_context: Optional[str] = None
