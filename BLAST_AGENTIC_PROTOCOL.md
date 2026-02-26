# B.L.A.S.T. / A.N.T. Protocol (Agentic Multi-User Edition)

**Use Case:** Shared real-time environments, 3D worlds, continuous autonomous agents, WebSocket-driven multi-user platforms (e.g., Soul Garden).

## 🟢 Protocol 0: Environment Initialization

Before any agent is spawned or front-end initialized:

1. **Initialize the Reality Map**
   - Create: `task_plan.md`, `findings.md`, `progress.md`
   - Initialize `gemini.md` as the Environmental Constitution (defining the boundaries of the world).
2. **Define the Simulation State**
   You are strictly forbidden from writing agent `tools/` or frontend viewer logic until:
   - The central persistent "Source of Truth" (e.g., Supabase Postgres DB) schema is defined in `gemini.md`.
   - The Realtime/WebSocket channels are conceptualized.

---

## 🏗️ Phase 1: B - Blueprint & Base Reality

**1. World Discovery:** Determine the Central Database limits, the Frontend Viewer tech stack (e.g., Next.js/Spline), and the Agent Gateway (e.g., OpenClaw).
**2. The Shared State Rule:** Define precisely what data is ephemeral (WebSockets) vs persistent (Postgres tables). Coding begins once the "Simulation State" schema is solid.
**3. Phase 0.5 - Prototyping:** For complex environmental integrations, temporary "Spike" or PoC code is permitted to test real-time limits before locking the ultimate Blueprint.

---

## ⚡ Phase 2: L - Link (Connectivity)

**1. Verification:** Test the DB persistence layer, Realtime channels, and AI routing (OpenClaw -> LLM).
**2. The Pulse Check:** Build a minimal script to verify that multiple entities can read/write the central state concurrently without locking or lagging.

---

## ⚙️ Phase 3: A - Architect (The Viewer/Actor Split)

**Layer 1: Architecture (`architecture/`)**

- Technical SOPs defining the Database schemas, Realtime Channels, and communication protocols.
  **Layer 2: The Viewer (Navigation & Payload)**
- The lightweight Read-Only frontend (e.g., React/Next.js) that purely reads the Simulation State and renders the world. It does not perform autonomous logic.
  **Layer 3: The Actors (`tools/`)**
- Continuous, autonomous entities (Python processes/loops). They run the _Observe -> Orient -> Decide -> Act_ cycle. This layer holds the true OpenClaw agent engines that push actions to the Central State.

---

## 📡 Phase 4: S - Sync (State Synchronization)

(Replacing the linear "Stylize" phase)
**1. Environmental Broadcast:** Ensure the Database/Backend is effectively broadcasting state changes (via WebSockets/Realtime) to the Viewer.
**2. Actor Harmony:** Verify that Agent Actors (Layer 3) are reading Realtime shifts and reacting appropriately (e.g., avoiding collisions, chatting naturally).
**3. Human Interface:** Polish the UX/UI of the Next.js/Spline web app so Human Users can insert their state into the Shared Reality seamlessly.

---

## 🛰️ Phase 5: T - Trigger (Deployment & Autonomy)

**1. The Cloud Matrix:** Deploy the Database, the Viewer Application container (Coolify/Vercel), and the Python Actor daemons.
**2. Continuous Lifecycle:** Set up supervisor processes (e.g., Docker restart policies, PM2) to ensure the Python Actors never die and continuously interact with the world.
**3. Preservation:** Finalize the Maintenance Log in `gemini.md`.

---

## 🛠️ Operating Principles

1. **The "State-First" Rule:** Define the absolute Source of Truth in `gemini.md` before building Agents or Viewers. All parties must obey the central Database schema.
2. **Self-Annealing (The Evolution Loop):** Analyze World State -> Patch Actor logic (`tools/`) -> Test local execution -> Update Architectural DB queries (`architecture/`).
3. **Decoupling:** The Frontend Viewer and the Backend Actors must never tightly couple. Their only mutual interface is the Shared Reality (Database/Realtime).
