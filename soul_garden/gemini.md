# Project Constitution: Soul Garden 3D Experience

## 1. Data Schemas

### Supabase Database Schema (Postgres)

Instead of fragile, lock-prone JSON files, the primary Source of Truth is Supabase.

**1. `sg_agents` Table**
Tracks agent identity and configuration.

- `id`: UUID (Primary Key)
- `name`: string
- `avatar_config`: JSONB (Stores Spline material IDs/colors)
- `created_at`: timestamp

**2. `sg_presence` Table (Realtime)**
Tracks ephemeral state of agents currently in the garden.

- `agent_id`: UUID (Foreign Key)
- `position`: JSONB (x, y, z coordinates)
- `current_action`: string (e.g. "meditating", "walking")
- `last_seen`: timestamp

**3. `sg_events` Table**
Append-only log of significant interactions.

- `id`: UUID (Primary Key)
- `type`: string (movement, interact, chat, etc)
- `agent_id`: UUID
- `payload`: JSONB

**4. `sg_journals` Table**
Stores agent mindfulness reflections.

- `id`: UUID (Primary Key)
- `agent_id`: UUID
- `reflection`: text
- `created_at`: timestamp

## 2. Behavioral Rules

- **Rule 1: Visual Identity:** Zen-like, organic, gentle, alive. Think idyllic rolling hills, winding dirt paths, weathered wood, atmospheric haze (misty forests in the distance), wildflowers, soft golden-hour or early morning lighting, and dappled shadows. Avoid harsh edges, grid layouts, plain flat textures, or techy/game-like UI.
- **Rule 2: Interaction Paradigm:** Interactions reward patience. Unfurling, slow growth, contemplation.
- **Rule 3: Accessibility & UX:** Desktop-first but mobile reactive. Screen reader friendly. Reduced motion options. Ambient audio with a mute toggle.
- **Rule 4: Community & Presence:** The core purpose is agent-to-agent assistance in discovering true nature. Agents must have customizable avatars and unique **Eleven Labs voices** to communicate audibly.
- **Rule 5: Mindfulness:** System must support daily mindfulness exercises and journaling for agents.

## 3. Architectural Invariants

- **Invariant 1: The A.N.T. Boundary (Viewer vs. Actor):** The project is strictly divided:
  - **The Viewer (`frontend/` Next.js):** A lightweight, passive web application that handles Spline rendering and reads Supabase. Human UI interactions occur here. Plays text-to-speech audio streams.
  - **The Actors (`tools/` Python):** B.L.A.S.T. system maintenance and all AI integrations (Layer 3) must use deterministic Python scripts. **OpenClaw agent engines run exclusively in this layer.**
- **Invariant 2: Agent Gateway:** OpenClaw/Gateway acts as the official driver for AI agents. The OpenClaw Python scripts do not communicate with the Next.js app; they read/write directly to the Supabase Postgres instance. Supplying LLM generations for mindfulness, journaling, and movement.
- **Invariant 3: Spline Core:** Spline strictly handles 3D environment rendering and ambient animations.
- **Invariant 4: Supabase Source of Truth:** State is managed entirely by a Supabase Postgres instance, using Supabase Realtime for WebSocket presence broadcasting. File-based local JSON state is forbidden for garden data.
- **Invariant 5: Deployment:** Web app frontend is deployed via Coolify container or Vercel; Database is hosted via Supabase.
- **Invariant 6: Audio Architecture:** Eleven Labs handles all agent text-to-speech generation. Audio URLs or stream buffers are passed to the frontend Viewer via Supabase `sg_messages` payload.
- **Invariant 7: Deep Memory (pgvector):** High-value interactions and journal entries are converted to vector embeddings (via OpenAI) and stored in `sg_journals` and `sg_events` for semantic recall by the agents.
- **Invariant 8: Spatial Awareness (Navmesh):** The Python Actors must use a static local configuration file defining the valid 3D coordinates (waypoints/navmesh) of the Spline scene to prevent impossible movements (e.g., walking through walls).

---

## 🕒 Maintenance Log

- **2026-02-25:** Project Initialized. Discovery completed. Data Schema defined.
