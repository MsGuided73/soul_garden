import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AlertTriangle, CheckCircle, XCircle, Shield } from 'lucide-react'

interface Report {
  id: string
  message_id: string
  reported_by: string
  reason: string
  status: string
  reviewer_notes: string | null
  created_at: string
  reviewed_at: string | null
}

interface ModerationEntry {
  id: string
  message_id: string | null
  content: string
  sender_id: string
  sender_name: string | null
  reason: string
  action: string
  created_at: string
}

export default function Moderation() {
  const [reports, setReports] = useState<Report[]>([])
  const [blocked, setBlocked] = useState<ModerationEntry[]>([])
  const [tab, setTab] = useState<'reports' | 'blocked'>('reports')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [reportsRes, blockedRes] = await Promise.all([
      supabase.from('sg_reports').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('sg_moderation_log').select('*').order('created_at', { ascending: false }).limit(50),
    ])
    if (reportsRes.data) setReports(reportsRes.data)
    if (blockedRes.data) setBlocked(blockedRes.data)
    setLoading(false)
  }

  const updateReport = async (reportId: string, status: string, notes: string = '') => {
    await supabase.from('sg_reports').update({
      status,
      reviewer_notes: notes || null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', reportId)
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status, reviewer_notes: notes } : r))
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-[var(--accent-drift)]'
      case 'actioned': return 'text-red-400'
      case 'dismissed': return 'text-[var(--text-muted)]'
      case 'reviewed': return 'text-[var(--accent-garden)]'
      default: return 'text-[var(--text-secondary)]'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[var(--text-muted)]">Loading moderation data...</div>
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-[var(--accent-soul)]" />
        <h1 className="heading-2">Moderation</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[var(--bg-secondary)] rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('reports')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'reports' ? 'bg-[var(--accent-soul)]/20 text-[var(--accent-soul)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Reports ({reports.filter((r) => r.status === 'pending').length} pending)
        </button>
        <button
          onClick={() => setTab('blocked')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'blocked' ? 'bg-[var(--accent-soul)]/20 text-[var(--accent-soul)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Auto-Blocked ({blocked.length})
        </button>
      </div>

      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="card text-center text-[var(--text-muted)] py-12">No reports yet. The garden is peaceful.</div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-[var(--accent-drift)]" />
                      <span className="text-sm font-medium">{report.reason}</span>
                      <span className={`text-xs font-medium uppercase ${statusColor(report.status)}`}>{report.status}</span>
                    </div>
                    <p className="text-small">Message ID: {report.message_id.slice(0, 8)}...</p>
                    <p className="text-small">{formatTime(report.created_at)}</p>
                    {report.reviewer_notes && (
                      <p className="text-sm text-[var(--text-secondary)] mt-2 italic">Notes: {report.reviewer_notes}</p>
                    )}
                  </div>
                  {report.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => updateReport(report.id, 'actioned', 'Content removed')}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Take action"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateReport(report.id, 'dismissed')}
                        className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        title="Dismiss"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'blocked' && (
        <div className="space-y-3">
          {blocked.length === 0 ? (
            <div className="card text-center text-[var(--text-muted)] py-12">No auto-blocked messages.</div>
          ) : (
            blocked.map((entry) => (
              <div key={entry.id} className="card">
                <div className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{entry.sender_name || entry.sender_id}</span>
                      <span className="text-xs text-red-400 font-medium uppercase">{entry.reason}</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] font-mono bg-[var(--bg-primary)] px-2 py-1 rounded">
                      {entry.content.slice(0, 100)}{entry.content.length > 100 ? '...' : ''}
                    </p>
                    <p className="text-small mt-1">{formatTime(entry.created_at)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
