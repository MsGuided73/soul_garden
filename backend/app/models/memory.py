"""
Memory Models
Three-layer memory system: working → RAG → archive
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class MemoryLayer(str, Enum):
    """Memory storage tiers."""
    WORKING = "working"     # Hot, in-context or Redis cache
    RAG = "rag"             # Vector search accessible (pgvector)
    ARCHIVE = "archive"     # Cold storage, needs hydration


class MemoryType(str, Enum):
    """Categories of memories."""
    INTERACTION = "interaction"     # Conversation with user or agent
    REFLECTION = "reflection"       # Self-generated insight
    EXTERNAL = "external"           # Ingested from documents/news
    DREAM = "dream"                 # Background processing output
    GOAL = "goal"                   # Active or completed objectives


class MemoryBase(BaseModel):
    """Base memory attributes."""
    content: str = Field(..., min_length=1)
    memory_type: MemoryType = MemoryType.INTERACTION
    category: Optional[str] = None
    importance_score: float = Field(default=0.5, ge=0.0, le=1.0)
    emotional_valence: Optional[Dict[str, float]] = None


class MemoryCreate(MemoryBase):
    """Model for creating a new memory."""
    agent_id: UUID
    layer: MemoryLayer = MemoryLayer.RAG
    source_type: Optional[str] = None
    source_id: Optional[UUID] = None
    expires_at: Optional[datetime] = None


class Memory(MemoryBase):
    """Full memory model as stored in database."""
    
    id: UUID
    agent_id: UUID
    
    # Storage layer
    layer: MemoryLayer
    
    # Temporal metadata
    created_at: datetime
    expires_at: Optional[datetime] = None
    accessed_at: Optional[datetime] = None
    access_count: int = 0
    
    # Source tracking
    source_type: Optional[str] = None
    source_id: Optional[UUID] = None
    
    # Vector embedding (internal use)
    content_embedding: Optional[List[float]] = Field(None, exclude=True)
    
    model_config = {"from_attributes": True}


class MemorySearchResult(BaseModel):
    """Result from semantic memory search."""
    
    id: UUID
    content: str
    memory_type: MemoryType
    similarity: float = Field(..., ge=0.0, le=1.0)
    created_at: datetime
    importance_score: float


class WorkingMemory(BaseModel):
    """Hot context window for active agent operation."""
    
    agent_id: UUID
    memories: List[Memory] = Field(default_factory=list)
    token_count: int = 0
    max_tokens: int = 8000
    
    def add_memory(self, memory: Memory) -> bool:
        """Add memory to working set if space allows."""
        # Rough token estimation: 4 chars ≈ 1 token
        estimated_tokens = len(memory.content) // 4
        if self.token_count + estimated_tokens > self.max_tokens:
            return False
        self.memories.append(memory)
        self.token_count += estimated_tokens
        return True
    
    def clear(self) -> None:
        """Clear working memory."""
        self.memories = []
        self.token_count = 0
