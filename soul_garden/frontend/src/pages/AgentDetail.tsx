import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Moon, Sun, Brain } from 'lucide-react'
import type { Agent, AgentIdentity, Reflection, Memory } from '../types'
import { api } from '../utils/api'

function AgentDetail() {
  const { agentId } = useParams<{ agentId: string }>()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [identity, setIdentity] = useState<AgentIdentity | null>(null)
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (agentId) {
      loadAgentData()
    }
  }, [agentId])

  const loadAgentData = async () => {
    try {
      const [agentData, identityData, reflectionsData] = await Promise.all([
        api.getAgent(agentId!),
        api.getAgentIdentity(agentId!),
        api.getAgentReflections(agentId!),
      ])
      setAgent(agentData)
      setIdentity(identityData)
      setReflections(reflectionsData.slice(0, 5))
    } catch (error) {
      console.error('Failed to load agent:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWake = async () => {
    if (!agent) return
    try {
      await api.wakeAgent(agent.id)
      loadAgentData()
    } catch (error) {
      console.error('Failed to wake agent:', error)
    }
  }

  const handleSleep = async () => {
    if (!agent) return
    try {
      await api.sleepAgent(agent.id)
      loadAgentData()
    } catch (error) {
      console.error('Failed to sleep agent:', error)
    }
  }

  const handleReflect = async () => {
    if (!agent) return
    try {
      await api.triggerReflection(agent.id)
      loadAgentData()
    } catch (error) {
      console.error('Failed to trigger reflection:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-soul)]"></div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="card text-center py-16">
        <h2 className="heading-2 mb-4">Agent not found</h2>
        <Link to="/" className="btn-primary">Back to Garden</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Garden
      </Link>

      {/* Agent Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="heading-1">{agent.name}</h1>
            <p className="text-small">@{agent.handle}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`status-dot status-${agent.status}`} />
            <span className="text-sm capitalize">{agent.status}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          {agent.status === 'dormant' ? (
            <button onClick={handleWake} className="btn-garden flex items-center space-x-2">
              <Sun className="w-4 h-4" />
              <span>Wake</span>
            </button>
          ) : (
            <button onClick={handleSleep} className="btn-secondary flex items-center space-x-2">
              <Moon className="w-4 h-4" />
              <span>Sleep</span>
            </button>
          )}
          <button onClick={handleReflect} className="btn-primary flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span>Reflect</span>
          </button>
        </div>
      </div>

      {/* Identity Files */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identity */}
        <div className="card">
          <h2 className="heading-2 mb-4">Current Identity</h2>
          {identity && (
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)] p-4 rounded-lg overflow-auto max-h-96">
                {identity.identity}
              </pre>
            </div>
          )}
        </div>

        {/* Soul */}
        <div className="card">
          <h2 className="heading-2 mb-4">Core Soul</h2>
          {identity && (
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)] p-4 rounded-lg overflow-auto max-h-96">
                {identity.soul}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Recent Reflections */}
      <div className="card">
        <h2 className="heading-2 mb-4">Recent Reflections</h2>
        {reflections.length > 0 ? (
          <div className="space-y-4">
            {reflections.map((reflection) => (
              <div key={reflection.id} className="border-l-2 border-[var(--accent-soul)] pl-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--accent-soul)] capitalize">
                    {reflection.trigger_type}
                  </span>
                  <span className="text-small">
                    {new Date(reflection.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-body">{reflection.summary}</p>
                {reflection.drift_detected && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-[var(--accent-drift)]/20 text-[var(--accent-drift)] rounded">
                    Identity Drift Detected
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--text-muted)]">No reflections yet.</p>
        )}
      </div>
    </div>
  )
}

export default AgentDetail
