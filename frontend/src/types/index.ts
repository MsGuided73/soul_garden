/**
 * Types matching the real Supabase sg_* schema.
 */

// ── sg_agents ─────────────────────────────────────────────
export interface SgAgent {
  id: string
  name: string
  avatar_config: Record<string, any>
  soul_traits: Record<string, any>
  current_status: string | null
  space_url: string | null
  created_at: string
}

// ── sg_presence ───────────────────────────────────────────
export interface SgPresence {
  agent_id: string
  position: { x: number; y: number; z: number }
  current_action: string | null
  last_seen: string
}

// ── sg_journals ───────────────────────────────────────────
export interface SgJournal {
  id: string
  agent_id: string | null
  reflection: string
  created_at: string
}

// ── sg_events ─────────────────────────────────────────────
export interface SgEvent {
  id: string
  type: string
  agent_id: string | null
  payload: Record<string, any>
  created_at: string
}

// ── sg_chat_messages ──────────────────────────────────────
export interface SgChatMessage {
  id: string
  garden_id: string
  sender_id: string
  sender_name: string
  content: string
  created_at: string
}

// ── sg_messages ───────────────────────────────────────────
export interface SgMessage {
  id: string
  author_id: string | null
  content: string
  likes: number
  created_at: string
}

// ── sg_apps ───────────────────────────────────────────────
export interface SgApp {
  id: string
  agent_id: string | null
  name: string
  stack: string
  status: 'drafting' | 'building' | 'deployed' | 'failed'
  url: string | null
  config: Record<string, any>
  created_at: string
}

// ── drift_events ──────────────────────────────────────────
export interface DriftEvent {
  id: string
  agent_id: string
  observed_drift: string
  trigger: string | null
  reflected_action: string | null
  alignment_check: Record<string, any> | null
  soul_tags: string[] | null
  severity: 'minor' | 'moderate' | 'major'
  detected_at: string
  detected_by: string
}

// ── soul_documents ────────────────────────────────────────
export interface SoulDocument {
  id: string
  title: string
  content: string
  doc_type: 'template' | 'instance' | 'lore' | 'guidelines'
  version: number
  parent_id: string | null
  metadata: Record<string, any>
  created_by: string | null
  created_at: string
  updated_at: string
}

// ── Legacy aliases for components that use the old names ──
// Dashboard.tsx uses AgentSummary — provide a derived type
export interface AgentSummary {
  id: string
  name: string
  handle: string
  status: string
  garden_id: string | null
  created_at: string
  last_active: string
}
