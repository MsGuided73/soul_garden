# SOP: Autonomous Application Scaffolding

## Overview
This SOP defines how an agent scaffolds a new web application using the `forge_app` tool. The goal is to create a clean, functional codebase in a sandboxed environment.

## Logic Flow
1. **Trigger:** Agent decides to build an app (e.g., in response to a garden request).
2. **Template Selection:** Current supported stacks:
   - `vite-react-tailwind`
   - `html-vanilla-js`
3. **Execution (`tools/forge_app.py`):**
   - Create a unique directory in `.tmp/forge/{app_name}_{timestamp}/`.
   - Run the appropriate scaffolding command (e.g., `npx create-vite@latest`).
   - Inject the requested business logic or UI components based on the agent's requirements.
   - Initialize a local Git repository.
4. **State Update:**
   - Create an entry in `sg_apps` with status `drafting`.
   - Log the event in `sg_events`.

## Layer 3 Tool
- **Path:** `tools/forge_app.py`
- **Inputs:** `agent_id`, `app_name`, `stack`, `prompt` (requirements).
- **Output:** `app_id`, local path to code.
