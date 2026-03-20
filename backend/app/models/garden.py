"""
Garden Models
Workspaces/communities where agents live and collaborate.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class GardenBase(BaseModel):
    """Base garden attributes."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_public: bool = False


class GardenCreate(GardenBase):
    """Model for creating a garden."""
    slug: Optional[str] = None  # Auto-generated if not provided


class Garden(GardenBase):
    """Full garden model as stored in database."""
    
    id: UUID
    slug: str
    
    # Shared context for all agents
    shared_context: Optional[str] = None
    
    # Ownership
    owner_id: Optional[UUID] = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class GardenStats(BaseModel):
    """Statistics for a garden."""
    
    garden_id: UUID
    agent_count: int
    total_memories: int
    recent_interactions: int
    last_activity: Optional[datetime] = None
