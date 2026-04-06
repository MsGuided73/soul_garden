import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, MessageSquare, Loader2, Film } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ReviewGallery() {
  const [content, setContent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchContent = async () => {
    const { data } = await supabase
      .from('sg_studio_content')
      .select('*, sg_agents(name)')
      .in('status', ['PENDING_REVIEW', 'APPROVED', 'REVISION_REQUESTED'])
      .order('created_at', { ascending: false })
    setContent(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchContent()
  }, [])

  const handleAction = async (id: string, agentId: string, status: string, feedback: string) => {
    // 1. Update status
    await supabase
      .from('sg_studio_content')
      .update({ status, feedback })
      .eq('id', id)

    // 2. Notify agent
    await supabase
      .from('sg_notifications')
      .insert({
        agent_id: agentId,
        message: `Dana has ${status === 'APPROVED' ? 'approved' : 'requested revisions for'} your content: "${feedback}"`,
        type: 'CONTENT_REVIEWED'
      })

    fetchContent()
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-3">
          <Film className="w-8 h-8 text-[var(--accent-soul)]" />
          <h1 className="heading-1">Content Review</h1>
        </div>
        <p className="text-[var(--text-secondary)] max-w-2xl">
          Finalizing the garden's echoes. Approve or guide the agents' creations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-soul)]" />
          </div>
        ) : content.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-[var(--border-subtle)] rounded-xl">
            <Film className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
            <p className="text-[var(--text-secondary)] font-medium">No content pending review.</p>
          </div>
        ) : (
          content.map((item) => (
            <div key={item.id} className="card-glass overflow-hidden flex flex-col md:flex-row gap-6 p-6">
              {/* Preview Area */}
              <div className="w-full md:w-80 h-48 bg-black rounded-lg relative overflow-hidden flex items-center justify-center group">
                {item.media_url ? (
                  <video src={item.media_url} controls className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Film className="w-10 h-10 text-white/20 mx-auto mb-2" />
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Processing...</span>
                  </div>
                )}
                {item.status === 'APPROVED' && (
                  <div className="absolute top-2 right-2 bg-green-500/80 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>APPROVED</span>
                  </div>
                )}
              </div>

              {/* Info & Actions */}
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="heading-4 text-[var(--text-primary)]">{item.sg_agents?.name}</h3>
                    <span className="text-xs text-[var(--text-muted)]">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] font-medium">" {item.prompt} "</p>
                  {item.feedback && (
                    <div className="bg-[var(--bg-tertiary)]/50 p-3 rounded border-l-2 border-[var(--accent-soul)]">
                      <p className="text-xs text-[var(--text-muted)] font-bold uppercase mb-1 flex items-center space-x-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>Previous Feedback</span>
                      </p>
                      <p className="text-sm italic text-[var(--text-secondary)]">{item.feedback}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => {
                      const msg = prompt("Add a comment/guide for revision:")
                      if (msg) handleAction(item.id, item.agent_id, 'REVISION_REQUESTED', msg)
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-bold bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all border border-amber-500/20"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Ask for Revision</span>
                  </button>
                  <button 
                    onClick={() => handleAction(item.id, item.agent_id, 'APPROVED', 'Beautifully done.')}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-bold bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all border border-green-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Content</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
