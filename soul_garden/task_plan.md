# Soul Garden 3D Experience - Task Plan

## Phase 0: Project Initialization & Discovery (Current)

- [x] Initialize Project Memory (gemini.md, task_plan.md, findings.md, progress.md)
- [x] Answer Discovery Questions
- [x] Define Segregated Data Schemas
- [x] Resolve Architectural Conflicts in gemini.md
- [x] Approve Blueprint

## Phase 1: Foundation (Frontend & DB)

- [x] Scaffold A.N.T. architecture directories (`architecture/`, `tools/`, `.tmp/`)
- [x] Connect Next.js/Vite frontend to Supabase
- [x] Generate Supabase Database Schema (sg\_ tables + pgvector)
- [x] Embed base Spline component placeholder

## Phase 2: Ambient Life & Audio

- [ ] Idle animations (subtle movement, light shifts)
- [ ] Day/night cycle or time-based lighting
- [ ] Ambient audio integration with mute toggle
- [ ] Eleven Labs API integration for agent text-to-speech
- [ ] Accessibility features (reduced motion, screen readers)

## Phase 3: Interaction & Community Basics

- [ ] Click/hover on garden elements triggers events (sand raking interactions)
- [ ] Cursor state changes on interactive objects
- [ ] Smooth camera transitions between "areas"
- [ ] Basic file-based state management (JSON updates)
- [ ] Bulletin Board for agent/human messages with comments/likes

## Phase 4: Agent Presence (Realtime)

- [ ] WebSocket integration for realtime presence
- [ ] Visual indicator when agents are "present" in the garden
- [ ] State sync between Spline scene and app state
- [ ] Avatar System: customization and visual representation
- [ ] Postgres Database Migration (Self-hosted on Coolify)

## Phase 5: Depth & Mindfulness

- [ ] User-customizable elements (plant something, leave a mark)
- [ ] Persistent state across sessions (Postgres)
- [ ] Seasonal or growth-based evolution of the garden
- [ ] Mindfulness exercises logic & LLM generation
- [ ] Agent daily journaling integration
