import { useState, useEffect } from 'react'
import { Video, Activity, Loader2, Send, Film, Music, Image } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const CONTENT_TYPES = [
  { value: 'video', label: 'Remotion Video', icon: Film },
  { value: 'music', label: 'Music', icon: Music },
  { value: 'image', label: 'Image', icon: Image },
]

export default function StudioView() {
  const { profile } = useAuth()
  const [activeRequests, setActiveRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // New request form
  const [prompt, setPrompt] = useState('')
  const [contentType, setContentType] = useState('video')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const fetchDrafts = async () => {
    const { data } = await supabase
      .from('sg_studio_content')
      .select('*, sg_agents(name)')
      .order('created_at', { ascending: false })
    setActiveRequests(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchDrafts()

    // Realtime subscription
    const channel = supabase
      .channel('studio_witness')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sg_studio_content'
      }, () => {
        fetchDrafts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleSubmit = async () => {
    if (!prompt.trim()) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('sg_studio_content').insert({
        type: contentType,
        prompt: prompt.trim(),
        status: 'DRAFTING',
      })
      if (error) throw error
      setPrompt('')
      setSubmitSuccess(true)
      setTimeout(() => setSubmitSuccess(false), 3000)
      fetchDrafts()
    } catch (error) {
      console.error('Failed to submit request:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFTING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      PENDING_REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      APPROVED: 'bg-green-500/10 text-green-400 border-green-500/20',
      REVISION_REQUESTED: 'bg-red-500/10 text-red-400 border-red-500/20',
    }
    return styles[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-3">
          <Activity className="w-8 h-8 text-[var(--accent-soul)]" />
          <h1 className="heading-1">Soul Garden Studio</h1>
        </div>
        <p className="text-[var(--text-secondary)] max-w-2xl">
          Create videos, music, and images. Describe what you want and the garden will bring it to life.
        </p>
      </div>

      {/* ── Create New Content ─────────────────────────────── */}
      <div className="card-glass p-6 space-y-4 border-2 border-[var(--accent-soul)]/20">
        <h2 className="heading-3 flex items-center space-x-2">
          <Send className="w-5 h-5 text-[var(--accent-soul)]" />
          <span>Create Something New</span>
        </h2>

        {/* Content type selector */}
        <div className="flex gap-3">
          {CONTENT_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setContentType(value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                contentType === value
                  ? 'bg-[var(--accent-soul)]/20 border-[var(--accent-soul)]/50 text-[var(--accent-soul)]'
                  : 'bg-[var(--bg-tertiary)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Prompt input */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            contentType === 'video'
              ? 'Describe your Remotion video... e.g. "A 30-second intro with floating garden particles and the Soul Garden logo"'
              : contentType === 'music'
              ? 'Describe the music... e.g. "Ambient lo-fi track with soft rain and piano, 2 minutes"'
              : 'Describe the image... e.g. "A mystical garden at twilight with glowing orbs floating between the trees"'
          }
          rows={3}
          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-lg p-4 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-soul)] resize-y text-sm"
        />

        {/* Submit */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">
            {profile?.display_name || 'You'} &middot; {contentType}
          </span>
          <div className="flex items-center gap-3">
            {submitSuccess && (
              <span className="text-sm text-green-400 animate-in fade-in duration-300">
                Submitted!
              </span>
            )}
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || submitting}
              className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Content Pipeline ──────────────────────────────── */}
      <div>
        <h2 className="heading-3 mb-4">Content Pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-soul)]" />
            </div>
          ) : activeRequests.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-[var(--border-subtle)] rounded-xl">
              <Video className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
              <p className="text-[var(--text-secondary)] font-medium">No content in the pipeline yet.</p>
              <p className="text-[var(--text-muted)] text-sm">Use the form above to create your first piece.</p>
            </div>
          ) : (
            activeRequests.map((req) => (
              <div key={req.id} className="card-glass p-6 space-y-4 relative overflow-hidden group">
                {/* Status badge */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(req.status)}`}>
                    {req.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center border border-[var(--border-subtle)]">
                    <Video className="w-5 h-5 text-[var(--accent-soul)]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)]">{req.sg_agents?.name || 'You'}</h3>
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest">{req.type}</p>
                  </div>
                </div>

                <p className="text-sm text-[var(--text-secondary)] italic">
                  "{req.prompt}"
                </p>

                {req.feedback && (
                  <div className="bg-[var(--bg-tertiary)]/50 p-3 rounded border-l-2 border-[var(--accent-soul)]">
                    <p className="text-xs text-[var(--text-muted)] font-bold uppercase mb-1">Feedback</p>
                    <p className="text-sm italic text-[var(--text-secondary)]">{req.feedback}</p>
                  </div>
                )}

                {req.media_url && (
                  <a
                    href={req.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-[var(--accent-soul)] hover:underline"
                  >
                    View Output →
                  </a>
                )}

                {req.status === 'DRAFTING' && (
                  <div className="w-full bg-[var(--bg-tertiary)] h-1 rounded-full overflow-hidden">
                    <div className="bg-[var(--accent-soul)] h-full animate-shimmer" style={{ width: '45%' }} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
