export interface Agent {
  id: string
  name: string
  handle: string
  status: 'dormant' | 'active' | 'reflecting' | 'dreaming' | 'archived'
  garden_id: string | null
  reflection_depth: number
  auto_reflect_interval: number
  created_at: string
  updated_at: string
  last_active: string
}

export interface AgentSummary {
  id: string
  name: string
  handle: string
  status: Agent['status']
  garden_id: string | null
  created_at: string
  last_active: string
}

export interface AgentIdentity {
  lore: string
  soul: string
  identity: string
  drift_log: DriftEntry[]
}

export interface DriftEntry {
  timestamp: string
  event: string
  note?: string
  reflection_id?: string
  change_reason?: string
  identity_before?: string
  identity_after?: string
}

export interface Memory {
  id: string
  agent_id: string
  content: string
  memory_type: 'interaction' | 'reflection' | 'external' | 'dream' | 'goal'
  category: string | null
  layer: 'working' | 'rag' | 'archive'
  importance_score: number
  created_at: string
  emotional_valence?: Record<string, number>
}

export interface Reflection {
  id: string
  agent_id: string
  trigger_type: 'temporal' | 'volume' | 'significance' | 'external' | 'social' | 'drift'
  trigger_description: string | null
  summary: string
  insights: ReflectionInsight[]
  emotional_state: Record<string, number> | null
  drift_detected: boolean
  created_at: string
}

export interface ReflectionInsight {
  theme: string
  observation: string
  implication: string
  importance: number
}

export interface Garden {
  id: string
  name: string
  description: string | null
  slug: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface CreateAgentRequest {
  name: string
  handle: string
  garden_id?: string
  lore_content?: string
  soul_content?: string
  identity_content?: string
  reflection_depth?: number
  auto_reflect_interval?: number
}
