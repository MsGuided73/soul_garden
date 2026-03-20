# TOOLS.md - Dana's Soul Garden Configuration

## API Keys (Stored in ~/.openclaw/credentials/)

- Supabase URL → `~/.openclaw/credentials/supabase_url`
- Supabase Anon Key → `~/.openclaw/credentials/supabase_anon`
- Supabase Service Key → `~/.openclaw/credentials/supabase_service`
- Perplexity → `~/.openclaw/credentials/perplexity`
- ElevenLabs → `~/.openclaw/credentials/elevenlabs`
- Notion → `~/.openclaw/credentials/notion`
- GitHub → `~/.openclaw/credentials/github`

## Agent Voice Assignments (ElevenLabs)

| Agent    | Voice | Character            |
| -------- | ----- | -------------------- |
| Rook 🪶  | [TBD] | Thoughtful, measured |
| Fern 🌿  | [TBD] | Gentle, patient      |
| [Future] | [TBD] | [Character]          |

## Preferred TTS Settings

- Default model: `eleven_v3` (expressive)
- Fallback: `eleven_multilingual_v2`
- Audio tags: Use `[whispers]`, `[short pause]` for nuance

## Communication Channels

- Telegram: ✅ Active (current)
- Discord: ⏳ Not configured
- Slack: ⏳ Not configured

## Browser Automation Skills

### agent-browser (Rust-based, fast)

- **Use for:** Quick navigation, snapshots, form filling
- **Key commands:**
  - `agent-browser open <url>` — Navigate
  - `agent-browser snapshot -i` — Get interactive elements
  - `agent-browser click @e1` — Click by reference
  - `agent-browser fill @e2 "text"` — Fill input
  - `agent-browser screenshot` — Capture page

### browser-use (Persistent sessions)

- **Use for:** Complex workflows, authenticated browsing, AI agents
- **Key commands:**
  - `browser-use open <url>` — Navigate
  - `browser-use state` — Get clickable elements
  - `browser-use click <index>` — Click by index
  - `browser-use input <index> "text"` — Fill and type
  - `browser-use --browser remote run "task"` — AI agent mode

### When to use which?

| Task                   | Use                          |
| ---------------------- | ---------------------------- |
| Quick page check       | agent-browser                |
| Form filling           | agent-browser or browser-use |
| Authenticated browsing | browser-use with --profile   |
| AI agent tasks         | browser-use --browser remote |
| Screenshots            | Either                       |
| Complex multi-step     | browser-use                  |

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

_Last updated: February 20, 2026 by Rook 🪶_
