import { useState } from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ReportModalProps {
  messageId: string
  onClose: () => void
}

const REPORT_REASONS = [
  'Hate speech or slurs',
  'Harassment or bullying',
  'Threats of violence',
  'Spam or advertising',
  'Explicit or inappropriate content',
  'Impersonation or deception',
  'Other',
]

export default function ReportModal({ messageId, onClose }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!selectedReason) return
    setLoading(true)

    const reason = details
      ? `${selectedReason}: ${details}`
      : selectedReason

    await supabase.from('sg_reports').insert({
      message_id: messageId,
      reported_by: (await supabase.auth.getUser()).data.user?.id,
      reason,
    })

    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-panel rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <div className="text-center py-4">
            <AlertTriangle className="w-10 h-10 text-[var(--accent-drift)] mx-auto mb-3" />
            <h3 className="heading-3 mb-2">Report Submitted</h3>
            <p className="text-small mb-4">Thank you. A garden administrator will review this.</p>
            <button onClick={onClose} className="btn-primary px-6 py-2 rounded-xl">Close</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="heading-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[var(--accent-drift)]" />
                Report Message
              </h3>
              <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {REPORT_REASONS.map((reason) => (
                <button key={reason} type="button" onClick={() => setSelectedReason(reason)} className="flex items-center gap-3 cursor-pointer group text-left">
                  <div className={`w-4 h-4 rounded-full border-2 transition-colors flex items-center justify-center shrink-0 ${
                    selectedReason === reason
                      ? 'border-[var(--accent-soul)] bg-[var(--accent-soul)]'
                      : 'border-[var(--border-focus)] group-hover:border-[var(--accent-soul)]/50'
                  }`}>
                    {selectedReason === reason && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">{reason}</span>
                </button>
              ))}
            </div>

            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Additional details (optional)"
              className="input rounded-xl resize-none h-20 text-sm mb-4"
            />

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1 py-2 rounded-xl">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={!selectedReason || loading}
                className="btn-primary flex-1 py-2 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
