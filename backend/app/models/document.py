"""
Document Models
Seed documents and ingested knowledge sources.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class DocumentType(str, Enum):
    """Types of documents in the system."""
    SEED = "seed"           # Initial personality/world documents
    INGESTED = "ingested"   # User-uploaded knowledge
    GENERATED = "generated" # Created by agents (journal entries, etc.)


class DocumentChunk(BaseModel):
    """A chunk of a document with embedding."""
    
    index: int
    content: str
    embedding: Optional[List[float]] = Field(None, exclude=True)


class DocumentBase(BaseModel):
    """Base document attributes."""
    title: str = Field(..., min_length=1, max_length=500)
    doc_type: DocumentType = DocumentType.SEED
    is_active: bool = True


class DocumentCreate(DocumentBase):
    """Model for creating a document."""
    agent_id: Optional[UUID] = None  # NULL = shared or garden doc
    garden_id: Optional[UUID] = None
    content: str  # Full content, will be chunked
    file_type: str = "markdown"


class Document(DocumentBase):
    """Full document model as stored in database."""
    
    id: UUID
    agent_id: Optional[UUID] = None
    garden_id: Optional[UUID] = None
    
    # Storage
    file_path: str
    file_type: str
    
    # Chunked content
    chunks: Optional[List[DocumentChunk]] = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class DocumentIngestRequest(BaseModel):
    """Request to ingest a document."""
    
    title: str
    content: str
    agent_id: Optional[UUID] = None
    garden_id: Optional[UUID] = None
    doc_type: DocumentType = DocumentType.INGESTED
    chunk_size: int = Field(default=1000, ge=100, le=5000)
    chunk_overlap: int = Field(default=200, ge=0, le=1000)
