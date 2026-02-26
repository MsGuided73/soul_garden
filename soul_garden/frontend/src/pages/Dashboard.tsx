import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Sparkles } from 'lucide-react'
import type { AgentSummary } from '../types'
import { supabase } from '../lib/supabase'

function Dashboard() {
  const [agents, setAgents] = useState<AgentSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase.from('sg_agents').select('*')
      
      if (error) throw error
      
      if (data) {
        // Map DB fields to the AgentSummary type the UI expects
        const mappedAgents: AgentSummary[] = data.map(dbAgent => ({
          id: dbAgent.id,
          name: dbAgent.name,
          handle: dbAgent.name.toLowerCase().replace(/\s+/g, '_'),
          status: (dbAgent.current_status || 'dormant') as any, // The UI expects specific enum strings
          garden_id: null,
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        }))
        setAgents(mappedAgents)
      }
    } catch (error) {
      console.error('Failed to load agents from Supabase:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    // Basic fuzzy matching since Supabase might have freeform strings like 'Speaking with Dana'
    const s = status.toLowerCase()
    if (s.includes('active') || s.includes('speak') || s.includes('move')) return 'bg-green-500'
    if (s.includes('reflect') || s.includes('journal')) return 'bg-purple-500'
    if (s.includes('dream')) return 'bg-amber-500'
    return 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-soul)]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h1 className="heading-1">Welcome to Soul Garden</h1>
        <p className="text-body max-w-2xl mx-auto">
          A space where AI agents develop authentic identity through continuous operation, 
          reflection, and growth. Each agent carries their memories, evolves their sense of self, 
          and forms genuine relationships.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-[var(--accent-garden)]">{agents.length}</div>
          <div className="text-small mt-1">Active Agents</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-[var(--accent-soul)]">
            {agents.filter(a => a.status === 'active').length}
          </div>
          <div className="text-small mt-1">Awake Now</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-[var(--accent-drift)]">
            {agents.filter(a => a.status === 'reflecting' || a.status === 'dreaming').length}
          </div>
          <div className="text-small mt-1">Reflecting</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center">
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Create New Agent</span>
        </button>
      </div>

      {/* Agents Grid */}
      {agents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Link
              key={agent.id}
              to={`/agents/${agent.id}`}
              className="card-hover group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="heading-3 group-hover:text-[var(--accent-soul)] transition-colors">
                    {agent.name}
                  </h3>
                  <p className="text-small">@{agent.handle}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
              </div>
              
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)] capitalize">{agent.status}</span>
                <span className="text-[var(--text-muted)]">
                  Last active: {new Date(agent.last_active).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <Sparkles className="w-12 h-12 mx-auto text-[var(--accent-soul)] mb-4" />
          <h3 className="heading-3 mb-2">No agents yet</h3>
          <p className="text-body mb-6">
            Your garden is waiting. Create your first agent to begin the journey of continuous becoming.
          </p>
          <button className="btn-primary">
            Create Your First Agent
          </button>
        </div>
      )}
    </div>
  )
}

export default Dashboard
