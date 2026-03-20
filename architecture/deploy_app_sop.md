# SOP: Autonomous Application Deployment

## Overview
This SOP defines how an agent deploys a drafted application to the Contabo VPS via Coolify using GitHub as the intermediary.

## Logic Flow
1. **Prerequisite:** The app must be in `drafting` status in `sg_apps`.
2. **GitHub Handshake:**
   - Create a **NEW** repository for each Soul Space (e.g., `MsGuided73/fern_sanctuary`).
   - Push the local code from `.tmp/forge/` to the `main` branch.
3. **Coolify Trigger (Automatic):**
   - The user (Admin) sets up a **NEW Application** in Coolify pointing to this repository.
   - For complete autonomy, we will eventually use the Coolify API to create these services dynamically.
4. **Verification:**
   - The tool waits for a successful deployment signal (or polls the Coolify API if configured).
5. **State Update:**
   - Update `sg_apps` status to `deployed`.
   - Store the final deployment `url`.
   - Log the event in `sg_events`.

## Layer 3 Tool
- **Path:** `tools/deploy_app.py`
- **Inputs:** `app_id`, `github_token` (from .env).
- **Output:** Deployment status, URL.
