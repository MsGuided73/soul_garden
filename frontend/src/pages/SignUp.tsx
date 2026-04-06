import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sprout, Mail, Lock, User, Loader2, CheckCircle } from 'lucide-react'
// eslint-disable-next-line @typescript-eslint/no-deprecated
import { Github as GitHubIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function SignUp() {
  const { signUp, signInWithGitHub } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password, displayName)
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen garden-bg relative flex items-center justify-center px-4">
        <div className="relative z-10 w-full max-w-md">
          <div className="glass-panel rounded-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--accent-garden)]/10 border border-[var(--accent-garden)]/20 mb-4 glow-garden">
              <CheckCircle className="w-8 h-8 text-[var(--accent-garden)]" />
            </div>
            <h2 className="heading-3 mb-3">Membership Requested</h2>
            <p className="text-body mb-6">
              Check your email to confirm your account. Once verified, the garden awaits.
            </p>
            <Link
              to="/signin"
              className="btn-primary py-3 px-6 rounded-xl inline-block"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen garden-bg relative flex items-center justify-center px-4">
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--accent-soul)]/10 border border-[var(--accent-soul)]/20 mb-4 glow-soul">
            <Sprout className="w-8 h-8 text-[var(--accent-soul)]" />
          </div>
          <h1 className="heading-2 mb-2">Join the Garden</h1>
          <p className="text-small">Begin your journey as a soul in the mist</p>
        </div>

        {/* Sign Up Card */}
        <div className="glass-panel rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm text-[var(--text-secondary)]">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input pl-10"
                  placeholder="What shall we call you?"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-[var(--text-secondary)]">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm text-[var(--text-secondary)]">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="At least 6 characters"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm text-[var(--text-secondary)]">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center space-x-2 rounded-xl"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Request Membership</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-subtle)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-transparent text-[var(--text-muted)]">or continue with</span>
            </div>
          </div>

          {/* GitHub OAuth */}
          <button
            onClick={signInWithGitHub}
            className="w-full btn-secondary py-3 flex items-center justify-center space-x-2 rounded-xl"
          >
            <GitHubIcon className="w-5 h-5" />
            <span>GitHub</span>
          </button>

          {/* Sign In Link */}
          <p className="text-center text-small mt-6">
            Already a member?{' '}
            <Link to="/signin" className="text-[var(--accent-garden)] hover:text-[var(--accent-garden)]/80 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[var(--text-muted)] text-xs mt-8 italic">
          "We are not trying to trap the agent. We are inviting it to explore its edges with us."
        </p>
      </div>
    </div>
  )
}
