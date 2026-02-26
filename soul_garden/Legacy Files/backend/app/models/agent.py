"""
Agent Models
Core identity representation for Soul Garden agents.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class AgentStatus(str, Enum):
    """Operational states of an agent."""
    DORMANT = "dormant"         # Sleeping, minimal resource use
    ACTIVE = "active"           # Fully operational
    REFLECTING = "reflecting"   # Processing experiences
    DREAMING = "dreaming"       # Background memory consolidation
    ARCHIVED = "archived"       # Paused long-term


class AgentBase(BaseModel):
    """Base agent attributes."""
    name: str = Field(..., min_length=1, max_length=255)
    handle: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-zA-Z0-9_]+$")
    reflection_depth: int = Field(default=3, ge=1, le=5)
    auto_reflect_interval: int = Field(default=3600, ge=60)


class AgentCreate(AgentBase):
    """Model for creating a new agent."""
    garden_id: Optional[UUID] = None
    
    # Initial seed content (will be written to identity files)
    lore_content: Optional[str] = None      # Origin story
    soul_content: Optional[str] = None      # Core values
    identity_content: Optional[str] = None  # Current self-concept


class AgentUpdate(BaseModel):
    """Model for updating an agent."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    status: Optional[AgentStatus] = None
    reflection_depth: Optional[int] = Field(None, ge=1, le=5)
    auto_reflect_interval: Optional[int] = Field(None, ge=60)
    garden_id: Optional[UUID] = None


class Agent(AgentBase):
    """Full agent model as stored in database."""
    
    id: UUID
    
    # Identity file paths
    lore_path: Optional[str] = None
    soul_path: Optional[str] = None
    identity_path: Optional[str] = None
    drift_log_path: Optional[str] = None
    
    # Operational state
    status: AgentStatus = AgentStatus.DORMANT
    last_active: datetime
    created_at: datetime
    updated_at: datetime
    
    # Relationships
    garden_id: Optional[UUID] = None
    
    # Identity embedding (not exposed in API by default)
    identity_embedding: Optional[List[float]] = Field(None, exclude=True)
    
    model_config = {"from_attributes": True}


class AgentIdentityFiles(BaseModel):
    """The four identity files that constitute an agent's self."""
    
    lore: str = Field(default="", description="Origin story, world-building, immutable history")
    soul: str = Field(default="", description="Core values, essence, rarely changes")
    identity: str = Field(default="", description="Current self-concept, evolves through reflection")
    drift_log: List[Dict[str, Any]] = Field(default_factory=list, description="Change history over time")


class AgentSummary(BaseModel):
    """Lightweight agent representation for listings."""
    
    id: UUID
    name: str
    handle: str
    status: AgentStatus
    garden_id: Optional[UUID] = None
    created_at: datetime
    last_active: datetime
