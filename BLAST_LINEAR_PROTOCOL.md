# B.L.A.S.T. / A.N.T. Protocol (Linear Automations)

**Use Case:** Scraping routines, API data migrations, static dashboard updates, and deterministic tool-based automations.

## 🟢 Protocol 0: Initialization (Mandatory)

Before any code is written or tools are built:

1. **Initialize Project Memory**
   - Create: `task_plan.md`, `findings.md`, `progress.md`
   - Initialize `gemini.md` as the Project Constitution
2. **Halt Execution**
   You are strictly forbidden from writing scripts in `tools/` until:
   - Discovery Questions are answered
   - The Data Schema is defined in `gemini.md`
   - `task_plan.md` has an approved Blueprint

---

## 🏗️ Phase 1: B - Blueprint (Vision & Logic)

**1. Discovery:** Ask the user the 5 questions (North Star, Integrations, Source of Truth, Delivery Payload, Behavioral Rules).
**2. Data-First Rule:** Define the JSON Data Schema in `gemini.md`. Coding only begins once the "Payload" shape is confirmed.
**3. Research:** Search github repos/databases for helpful resources.

---

## ⚡ Phase 2: L - Link (Connectivity)

**1. Verification:** Test all API connections and `.env` credentials.
**2. Handshake:** Build minimal scripts in `tools/` to verify external services respond correctly before full logic buildup.

---

## ⚙️ Phase 3: A - Architect (The 3-Layer Build)

**Layer 1: Architecture (`architecture/`)**

- Technical SOPs in Markdown. Define goals, inputs, tool logic, edge cases. (If logic changes, update SOP before code).
  **Layer 2: Navigation (Decision Making)**
- The reasoning layer. Route data between SOPs and Tools. No complex tasks; call execution tools in order.
  **Layer 3: Tools (`tools/`)**
- Deterministic Python scripts. Atomic and testable. `.tmp/` for intermediates.

---

## ✨ Phase 4: S - Stylize (Refinement & UI)

**1. Payload Refinement:** Format outputs (Slack, Notion, Email HTML) for delivery.
**2. UI/UX:** Clean CSS/HTML for dashboards.
**3. Feedback:** Present stylized results to user.

---

## 🛰️ Phase 5: T - Trigger (Deployment)

**1. Cloud Transfer:** Move logic from local testing to production cloud.
**2. Automation:** Set up execution triggers (Cron jobs, Webhooks).
**3. Documentation:** Finalize the Maintenance Log in `gemini.md`.

---

## 🛠️ Operating Principles

1. **The "Data-First" Rule:** Define `gemini.md` schema before building.
2. **Self-Annealing (The Repair Loop):** Analyze -> Patch (`tools/`) -> Test -> Update Architecture (`architecture/`).
3. **Deliverables:** Local (`.tmp/`) vs Global (Cloud Payload). Project complete only when payload is in the cloud.
