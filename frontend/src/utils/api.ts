import type { 
  Agent, 
  AgentSummary, 
  AgentIdentity, 
  Reflection, 
  Memory, 
  Garden,
  CreateAgentRequest 
} from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Agents
  async getAgents(gardenId?: string): Promise<AgentSummary[]> {
    const query = gardenId ? `?garden_id=${gardenId}` : ''
    return this.fetch<AgentSummary[]>(`/api/agents${query}`)
  }

  async getAgent(id: string): Promise<Agent> {
    return this.fetch<Agent>(`/api/agents/${id}`)
  }

  async getAgentByHandle(handle: string): Promise<Agent> {
    return this.fetch<Agent>(`/api/agents/handle/${handle}`)
  }

  async createAgent(data: CreateAgentRequest): Promise<Agent> {
    return this.fetch<Agent>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async wakeAgent(id: string): Promise<void> {
    await this.fetch(`/api/agents/${id}/wake`, { method: 'POST' })
  }

  async sleepAgent(id: string): Promise<void> {
    await this.fetch(`/api/agents/${id}/sleep`, { method: 'POST' })
  }

  // Agent Identity
  async getAgentIdentity(id: string): Promise<AgentIdentity> {
    return this.fetch<AgentIdentity>(`/api/agents/${id}/identity`)
  }

  // Reflections
  async getAgentReflections(agentId: string): Promise<Reflection[]> {
    return this.fetch<Reflection[]>(`/api/reflections/agent/${agentId}`)
  }

  async triggerReflection(agentId: string): Promise<Reflection> {
    return this.fetch<Reflection>(`/api/reflections/agent/${agentId}/reflect`, {
      method: 'POST',
    })
  }

  // Memories
  async getAgentMemories(agentId: string): Promise<Memory[]> {
    return this.fetch<Memory[]>(`/api/memories/agent/${agentId}`)
  }

  async searchMemories(agentId: string, query: string): Promise<Memory[]> {
    return this.fetch<Memory[]>(`/api/memories/agent/${agentId}/search?q=${encodeURIComponent(query)}`)
  }

  // Gardens
  async getGardens(): Promise<Garden[]> {
    return this.fetch<Garden[]>('/api/gardens')
  }

  async getGarden(id: string): Promise<Garden> {
    return this.fetch<Garden>(`/api/gardens/${id}`)
  }

  async getGardenBySlug(slug: string): Promise<Garden> {
    return this.fetch<Garden>(`/api/gardens/slug/${slug}`)
  }

  // Health
  async health(): Promise<{ status: string; app: string; version: string }> {
    return this.fetch('/health')
  }
}

export const api = new ApiClient(API_URL)
