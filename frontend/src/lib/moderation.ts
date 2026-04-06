/**
 * Content moderation filter for Soul Garden chat.
 * Fast regex-based filter for obvious violations.
 * Subtle/borderline content should be reported by users.
 */

// Slurs and hate speech patterns (case-insensitive)
// This is intentionally a curated list — not exhaustive.
// The reporting system handles what regex can't.
const BLOCKED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // Racial slurs
  { pattern: /\bn[i1]gg[ae3]r?s?\b/i, reason: 'racial slur' },
  { pattern: /\bk[i1]ke\b/i, reason: 'antisemitic slur' },
  { pattern: /\bsp[i1]c[ks]?\b/i, reason: 'ethnic slur' },
  { pattern: /\bch[i1]nk\b/i, reason: 'racial slur' },
  { pattern: /\bw[e3]tb[a4]ck\b/i, reason: 'ethnic slur' },

  // Homophobic/transphobic slurs
  { pattern: /\bf[a4]gg?[o0]t\b/i, reason: 'homophobic slur' },
  { pattern: /\btr[a4]nn(?:y|ie)\b/i, reason: 'transphobic slur' },
  { pattern: /\bd[y1]ke\b/i, reason: 'homophobic slur' },

  // Gendered slurs used as attacks
  { pattern: /\bc[u]+nt\b/i, reason: 'gendered slur' },

  // Threats of violence
  { pattern: /\b(?:i(?:'?ll|m\s+(?:gonna|going\s+to))\s+)?kill\s+(?:you|u|them|everyone)\b/i, reason: 'threat of violence' },
  { pattern: /\bkill\s+(?:your)?self\b/i, reason: 'incitement to self-harm' },
  { pattern: /\bgo\s+die\b/i, reason: 'incitement to self-harm' },

  // Spam patterns
  { pattern: /(.)\1{10,}/i, reason: 'character spam' },
  { pattern: /(?:buy\s+now|click\s+here|free\s+money|act\s+now).{0,20}(?:http|www\.)/i, reason: 'spam/advertising' },
]

export interface ModerationResult {
  allowed: boolean
  reason?: string
  action?: 'blocked' | 'flagged'
}

/**
 * Checks a message against the content filter.
 * Returns { allowed: true } if clean, or { allowed: false, reason, action } if violation found.
 */
export function moderateContent(content: string): ModerationResult {
  const trimmed = content.trim()

  // Empty messages
  if (!trimmed) {
    return { allowed: false, reason: 'empty message', action: 'blocked' }
  }

  // Check against blocked patterns
  for (const { pattern, reason } of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { allowed: false, reason, action: 'blocked' }
    }
  }

  return { allowed: true }
}
