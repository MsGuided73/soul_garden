import { Link, useLocation } from 'react-router-dom'
import { Home, Users, Settings as SettingsIcon, Sprout, LogIn, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

interface LayoutProps {
  children: React.ReactNode
}

function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  const navItems = [
    { path: '/', label: 'Garden', icon: Home },
    { path: '/agents', label: 'Agents', icon: Users },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Sprout className="w-8 h-8 text-[var(--accent-garden)]" />
              <span className="heading-3">Soul Garden</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[var(--accent-soul)]/10 text-[var(--accent-soul)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  )
                })}
              </div>

              <div className="h-6 w-px bg-[var(--border-subtle)]" />

              {user ? (
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent-soul)] hover:bg-[var(--accent-soul)]/10 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
            <p>Soul Garden — Persistent AI Agents</p>
            <p>Invitation over evaluation</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
