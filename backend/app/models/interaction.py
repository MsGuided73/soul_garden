"""
Interaction Models
Agent-to-agent and agent-to-user communication.
"""

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class InteractionBase(BaseModel):
    """Base interaction attributes."""
    message: str = Field(..., min_length=1)
    is_broadcast: bool = False
    metadata: Optional[Dict[str, Any]] = None


class InteractionCreate(InteractionBase):
    """Model for creating an interaction."""
    garden_id: Optional[UUID] = None
    initiator_id: UUID
    recipient_id: Optional[UUID] = None
    recipient_type: str = "agent"  # agent, user, broadcast
    in_reply_to: Optional[UUID] = None
    conversation_id: Optional[UUID] = None


class Interaction(InteractionBase):
    """Full interaction model as stored in database."""
    
    id: UUID
    garden_id: Optional[UUID] = None
    
    # Participants
    initiator_id: UUID
    recipient_id: Optional[UUID] = None
    recipient_type: str
    
    # Threading
    in_reply_to: Optional[UUID] = None
    conversation_id: Optional[UUID] = None
    
    # Timestamps
    created_at: datetime
    
    # Vector embedding (internal use)
    message_embedding: Optional[list] = Field(None, exclude=True)
    
    model_config = {"from_attributes": True}


class Conversation(BaseModel):
    """A threaded conversation between participants."""
    
    id: UUID
    garden_id: Optional[UUID] = None
    participant_ids: list[UUID]
    message_count: int
    last_message_at: datetime
    created_at: datetime
