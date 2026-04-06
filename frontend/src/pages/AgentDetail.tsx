import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Moon, Sun, Brain, Save } from 'lucide-react'
import type { SgAgent, SgJournal } from '../types'
import { supabase } from '../lib/supabase'

function AgentDetail() {
  const { agentId } = useParams<{ agentId: string }>()
  const [agent, setAgent] = useState<SgAgent | null>(null)
  const [journals, setJournals] = useState<SgJournal[]>([])
  const [loading, setLoading] = useState(true)
  const [newEntry, setNewEntry] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (agentId) {
      loadAgentData()
    }
  }, [agentId])

  const loadAgentData = async () => {
    try {
      // Fetch agent details from sg_agents
      const { data: agentData, error: agentError } = await supabase
        .from('sg_agents')
        .select('*')
        .eq('id', agentId!)
        .single()

      if (agentError) throw agentError
      setAgent(agentData)

      // Fetch journal entries (reflections) from sg_journals
      const { data: journalData, error: journalError } = await supabase
        .from('sg_journals')
        .select('*')
        .eq('agent_id', agentId!)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!journalError && journalData) {
        setJournals(journalData)
      }
    } catch (error) {
      console.error('Failed to load agent:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWake = async () => {
    if (!agent) return
    try {
      // Write a wake event to sg_events — the tools/ layer picks it up
      await supabase.from('sg_events').insert({
        type: 'WAKE_AGENT',
        agent_id: agent.id,
        payload: { requested_by: 'dashboard' },
      })
      // Optimistically update local state
      setAgent({ ...agent, current_status: 'active' })
      // Also update the agent's status in sg_agents
      await supabase
        .from('sg_agents')
        .update({ current_status: 'active' })
        .eq('id', agent.id)
    } catch (error) {
      console.error('Failed to wake agent:', error)
    }
  }

  const handleSleep = async () => {
    if (!agent) return
    try {
      await supabase.from('sg_events').insert({
        type: 'SLEEP_AGENT',
        agent_id: agent.id,
        payload: { requested_by: 'dashboard' },
      })
      setAgent({ ...agent, current_status: 'dormant' })
      await supabase
        .from('sg_agents')
        .update({ current_status: 'dormant' })
        .eq('id', agent.id)
    } catch (error) {
      console.error('Failed to sleep agent:', error)
    }
  }

  const handleSaveJournal = async () => {
    if (!agent || !newEntry.trim()) return
    setSaving(true)
    try {
      const { error } = await supabase.from('sg_journals').insert({
        agent_id: agent.id,
        reflection: newEntry.trim(),
      })
      if (error) throw error
      setNewEntry('')
      loadAgentData()
    } catch (error) {
      console.error('Failed to save journal entry:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleReflect = async () => {
    if (!agent) return
    try {
      // Write a reflection request event — the tools/ layer processes it
      await supabase.from('sg_events').insert({
        type: 'REQUEST_REFLECTION',
        agent_id: agent.id,
        payload: { requested_by: 'dashboard', trigger: 'manual' },
      })
      // Briefly show reflecting status
      setAgent({ ...agent, current_status: 'reflecting' })
    } catch (error) {
      console.error('Failed to trigger reflection:', error)
    }
  }

  const getStatusColor = (status: string | null) => {
    const s = (status || '').toLowerCase()
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

  if (!agent) {
    return (
      <div className="card text-center py-16">
        <h2 className="heading-2 mb-4">Agent not found</h2>
        <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
      </div>
    )
  }

  const displayStatus = agent.current_status || 'dormant'
  const isDormant = displayStatus.toLowerCase().includes('dormant') || !agent.current_status

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/dashboard" className="inline-flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      {/* Agent Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="heading-1">{agent.name}</h1>
            <p className="text-small">@{agent.name.toLowerCase().replace(/\s+/g, '_')}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${getStatusColor(displayStatus)}`} />
            <span className="text-sm capitalize">{displayStatus}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          {isDormant ? (
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

      {/* Soul Traits */}
      {agent.soul_traits && Object.keys(agent.soul_traits).length > 0 && (
        <div className="card">
          <h2 className="heading-2 mb-4">Soul Traits</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(agent.soul_traits).map(([key, value]) => (
              <div key={key} className="bg-[var(--bg-tertiary)] p-3 rounded-lg">
                <span className="text-small capitalize">{key.replace(/_/g, ' ')}</span>
                <p className="text-sm text-[var(--text-primary)] mt-1">{String(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Soul Space Link */}
      {agent.space_url && (
        <div className="card">
          <h2 className="heading-2 mb-4">Soul Space</h2>
          <a
            href={agent.space_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
          >
            Visit {agent.name}'s Sanctuary →
          </a>
        </div>
      )}

      {/* New Journal Entry */}
      <div className="card">
        <h2 className="heading-2 mb-4">New Journal Entry</h2>
        <textarea
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          placeholder="Write a reflection..."
          rows={4}
          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-lg p-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-soul)] resize-y"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleSaveJournal}
            disabled={!newEntry.trim() || saving}
            className="btn-primary flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Entry'}</span>
          </button>
        </div>
      </div>

      {/* Recent Journals / Reflections */}
      <div className="card">
        <h2 className="heading-2 mb-4">Recent Reflections</h2>
        {journals.length > 0 ? (
          <div className="space-y-4">
            {journals.map((journal) => (
              <div key={journal.id} className="border-l-2 border-[var(--accent-soul)] pl-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--accent-soul)]">
                    Journal Entry
                  </span>
                  <span className="text-small">
                    {new Date(journal.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-body whitespace-pre-wrap">{journal.reflection}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--text-muted)]">No reflections yet. This agent hasn't journaled.</p>
        )}
      </div>
    </div>
  )
}

export default AgentDetail
