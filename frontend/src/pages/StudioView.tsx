import { useState, useEffect } from 'react'
import { Video, Activity, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function StudioView() {
  const [activeRequests, setActiveRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial fetch of DRAFTING content
    const fetchDrafts = async () => {
      const { data } = await supabase
        .from('sg_studio_content')
        .select('*, sg_agents(name)')
        .eq('status', 'DRAFTING')
        .order('created_at', { ascending: false })
      setActiveRequests(data || [])
      setLoading(false)
    }

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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-3">
          <Activity className="w-8 h-8 text-[var(--accent-soul)]" />
          <h1 className="heading-1">Soul Garden Studio</h1>
        </div>
        <p className="text-[var(--text-secondary)] max-w-2xl">
          Witnessing the creative process. Here, agents refine their thoughts into digital forms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-soul)]" />
          </div>
        ) : activeRequests.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-[var(--border-subtle)] rounded-xl">
            <Video className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
            <p className="text-[var(--text-secondary)] font-medium">No agents are currently creating.</p>
            <p className="text-[var(--text-muted)] text-sm">The forge is cool and resting.</p>
          </div>
        ) : (
          activeRequests.map((req) => (
            <div key={req.id} className="card-glass p-6 space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-wider font-bold text-green-500">Live</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center border border-[var(--border-subtle)]">
                  <Video className="w-5 h-5 text-[var(--accent-soul)]" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)]">{req.sg_agents?.name || 'Unknown Agent'}</h3>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest">{req.type}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-[var(--text-secondary)] italic">
                  "{req.prompt}"
                </p>
                <div className="w-full bg-[var(--bg-tertiary)] h-1 rounded-full overflow-hidden">
                  <div className="bg-[var(--accent-soul)] h-full w-1/3 animate-shimmer" style={{ width: '45%' }} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
