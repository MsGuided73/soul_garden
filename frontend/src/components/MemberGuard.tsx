import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

interface MemberGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function MemberGuard({ children, fallback }: MemberGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="animate-pulse flex space-x-2 items-center text-white/40 text-xs">
      <div className="w-2 h-2 bg-white/40 rounded-full"></div>
      <span>Verifying Membership...</span>
    </div>
  }

  if (!user) {
    return <>{fallback ?? <div className="glass-panel p-6 rounded-3xl text-center border border-white/10 bg-white/5 backdrop-blur-2xl">
      <p className="text-white/60 text-xs mb-3 uppercase tracking-[0.2em] font-bold">Membership Required</p>
      <p className="text-white/40 text-[11px] leading-relaxed mb-6 italic font-medium px-4">
        Only verified members can speak into the garden resonance.
      </p>
      <button 
        onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })}
        className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-white text-xs font-bold tracking-widest uppercase transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        Sign in with GitHub
      </button>
    </div>}</>
  }

  return <>{children}</>
}
