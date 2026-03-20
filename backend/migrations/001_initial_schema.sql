-- Soul Garden Initial Schema
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- AGENTS TABLE
-- Core identity with vector embedding for personality
-- ============================================
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    handle VARCHAR(100) UNIQUE NOT NULL,  -- @agent_name
    
    -- Identity evolution files (paths to storage)
    lore_path TEXT,                       -- Origin story, world-building
    soul_path TEXT,                       -- Core values, essence
    identity_path TEXT,                   -- Current self-concept
    drift_log_path TEXT,                  -- Change history
    
    -- Vector embedding of current identity (for similarity search)
    identity_embedding VECTOR(1536),      -- OpenAI text-embedding-3-small
    
    -- Operational state
    status VARCHAR(50) DEFAULT 'dormant', -- dormant, active, reflecting, dreaming
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Reflection configuration
    reflection_depth INTEGER DEFAULT 3,   -- 1-5 scale
    auto_reflect_interval INTEGER DEFAULT 3600, -- seconds
    
    -- Garden assignment
    garden_id UUID REFERENCES gardens(id) ON DELETE SET NULL
);

-- Index for similarity search on agent identities
CREATE INDEX idx_agents_identity_embedding ON agents 
    USING ivfflat (identity_embedding vector_cosine_ops)
    WITH (lists = 100);

-- ============================================
-- GARDENS TABLE
-- Workspaces/communities of agents
-- ============================================
CREATE TABLE gardens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    
    -- Garden metadata
    is_public BOOLEAN DEFAULT false,
    owner_id UUID,  -- Could link to users table later
    
    -- Shared context for all agents in garden
    shared_context TEXT,
    shared_context_embedding VECTOR(1536),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEMORIES TABLE
-- Three-layer memory: working → RAG (this) → archive
-- ============================================
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Memory content
    content TEXT NOT NULL,
    content_embedding VECTOR(1536) NOT NULL,
    
    -- Memory classification
    memory_type VARCHAR(50) NOT NULL,     -- interaction, reflection, external, dream
    category VARCHAR(100),                -- user-defined tags
    
    -- Layer management
    layer VARCHAR(20) DEFAULT 'rag',      -- working, rag, archive
    importance_score FLOAT DEFAULT 0.5,   -- 0.0 - 1.0 (calculated by agent)
    
    -- Temporal metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,               -- NULL = permanent
    accessed_at TIMESTAMPTZ,              -- Last retrieval time
    access_count INTEGER DEFAULT 0,       -- Frequency of retrieval
    
    -- Source tracking
    source_type VARCHAR(50),              -- conversation, document, reflection, agent
    source_id UUID,                       -- Reference to source (conversation_id, etc.)
    
    -- Emotional valence (optional, for drift tracking)
    emotional_valence JSONB               -- {joy: 0.8, curiosity: 0.6, ...}
);

-- Critical indexes for memory retrieval
CREATE INDEX idx_memories_agent_id ON memories(agent_id);
CREATE INDEX idx_memories_agent_layer ON memories(agent_id, layer);
CREATE INDEX idx_memories_created_at ON memories(created_at DESC);
CREATE INDEX idx_memories_importance ON memories(importance_score DESC);

-- Vector similarity index (IVFFlat for ~100k+ vectors)
CREATE INDEX idx_memories_embedding ON memories 
    USING ivfflat (content_embedding vector_cosine_ops)
    WITH (lists = 100);

-- ============================================
-- REFLECTIONS TABLE
-- Generated self-analysis and insights
-- ============================================
CREATE TABLE reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Reflection metadata
    trigger_type VARCHAR(50) NOT NULL,    -- temporal, volume, significance, external, social
    trigger_description TEXT,             -- What caused this reflection
    
    -- Content
    summary TEXT NOT NULL,                -- High-level summary
    insights JSONB NOT NULL,              -- Array of insight objects
    emotional_state JSONB,                -- Agent's self-assessed state
    
    -- Identity evolution tracking
    identity_delta JSONB,                 -- Changes to IDENTITY.md
    drift_detected BOOLEAN DEFAULT false, -- Significant personality shift?
    
    -- Source memories that contributed
    source_memory_ids UUID[],             -- References to memories table
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reflections_agent_id ON reflections(agent_id);
CREATE INDEX idx_reflections_created_at ON reflections(created_at DESC);
CREATE INDEX idx_reflections_drift ON reflections(agent_id, drift_detected) WHERE drift_detected = true;

-- ============================================
-- DOCUMENTS TABLE
-- Seed documents and ingested knowledge
-- ============================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,  -- NULL = shared
    garden_id UUID REFERENCES gardens(id) ON DELETE CASCADE, -- NULL = private to agent
    
    -- Document metadata
    title VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,              -- Storage location
    file_type VARCHAR(50),                -- markdown, txt, pdf
    
    -- Content (chunked for RAG)
    chunks JSONB,                         -- Array of {content, embedding, index}
    
    -- Document type
    doc_type VARCHAR(50) DEFAULT 'seed',  -- seed, ingested, generated
    is_active BOOLEAN DEFAULT true,       -- Include in RAG?
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_agent_id ON documents(agent_id);
CREATE INDEX idx_documents_garden_id ON documents(garden_id);

-- ============================================
-- INTERACTIONS TABLE
-- Agent-to-agent and agent-to-user conversations
-- ============================================
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    garden_id UUID REFERENCES gardens(id) ON DELETE CASCADE,
    
    -- Participants
    initiator_id UUID NOT NULL REFERENCES agents(id),
    recipient_id UUID REFERENCES agents(id),  -- NULL = user or broadcast
    recipient_type VARCHAR(50) DEFAULT 'agent', -- agent, user, broadcast
    
    -- Content
    message TEXT NOT NULL,
    message_embedding VECTOR(1536),
    
    -- Context
    in_reply_to UUID REFERENCES interactions(id),
    conversation_id UUID,                 -- Thread identifier
    
    -- Metadata
    is_broadcast BOOLEAN DEFAULT false,
    metadata JSONB,                       -- Additional context
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interactions_conversation ON interactions(conversation_id);
CREATE INDEX idx_interactions_initiator ON interactions(initiator_id);
CREATE INDEX idx_interactions_recipient ON interactions(recipient_id);
CREATE INDEX idx_interactions_created_at ON interactions(created_at DESC);

-- ============================================
-- AGENT_RELATIONSHIPS TABLE
-- Track bonds between agents
-- ============================================
CREATE TABLE agent_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_a_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    agent_b_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Relationship dynamics
    relationship_type VARCHAR(100),       -- friend, mentor, collaborator, rival, etc.
    closeness_score FLOAT DEFAULT 0.0,    -- 0.0 - 1.0
    
    -- Shared context
    shared_memories_count INTEGER DEFAULT 0,
    last_interaction_at TIMESTAMPTZ,
    
    -- Evolution tracking
    history JSONB DEFAULT '[]',           -- Array of relationship events
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(agent_a_id, agent_b_id)
);

CREATE INDEX idx_relationships_agent_a ON agent_relationships(agent_a_id);
CREATE INDEX idx_relationships_agent_b ON agent_relationships(agent_b_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gardens_updated_at BEFORE UPDATE ON gardens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON agent_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SIMILARITY SEARCH FUNCTIONS
-- ============================================

-- Search similar memories for an agent
CREATE OR REPLACE FUNCTION search_agent_memories(
    p_agent_id UUID,
    p_query_embedding VECTOR(1536),
    p_limit INTEGER DEFAULT 10,
    p_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    memory_type VARCHAR,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.content,
        m.memory_type,
        1 - (m.content_embedding <=> p_query_embedding) AS similarity
    FROM memories m
    WHERE m.agent_id = p_agent_id
        AND m.layer = 'rag'
        AND 1 - (m.content_embedding <=> p_query_embedding) > p_threshold
    ORDER BY m.content_embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Search across all agents in a garden (for shared context)
CREATE OR REPLACE FUNCTION search_garden_memories(
    p_garden_id UUID,
    p_query_embedding VECTOR(1536),
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    agent_id UUID,
    agent_name VARCHAR,
    content TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.agent_id,
        a.name AS agent_name,
        m.content,
        1 - (m.content_embedding <=> p_query_embedding) AS similarity
    FROM memories m
    JOIN agents a ON m.agent_id = a.id
    WHERE a.garden_id = p_garden_id
        AND m.layer = 'rag'
    ORDER BY m.content_embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
