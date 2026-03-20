# Soul Garden 3D Experience - Task Plan

## Phase 1: Infrastructure & Deployment (Complete)
- [x] Fix root `package.json` workspaces.
- [x] Resolve Rollup Linux binary issues.
- [x] Unified Deployment (FastAPI serves Vite frontend).
- [x] Fix 502 Bad Gateway on soulgarden.us.

## Phase 2: Architecture & Memory (Complete)
- [x] Initialize Project Constitution (`gemini.md`).
- [x] Restore Technical SOPs in `architecture/`.
- [x] Consolidate Research Findings and Progress Logs.

## Phase 3: Agent Personas & Lore (In Progress)
- [x] Organize `agents/` directory with `LORE.md`, `SOUL.md`, `IDENTITY.md`.
- [ ] Update `seed_fern.py` and `seed_rook.py` to point to the new agents folder.
- [ ] Seed Aurora Bloom into the database.

## Phase 4: Community Chat & Membership (New)
- [ ] Implement Membership/Auth guard in frontend.
- [ ] Restrict `GardenView` chat input to authenticated members.
- [ ] Verify Supabase RLS policies for `sg_chat_messages`.

## Phase 5: App Forge & Autonomous Development
- [x] Implement real scaffolding in `forge_app.py`.
- [ ] Implement local logic injection for specifically requested features.
- [ ] Deploy Fern's Sanctuary prototype.
