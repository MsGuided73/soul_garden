# SOP-001: Soul Garden VPS Deployment

## Goal
Reliably deploy the Soul Garden application stack to a Contabo VPS managed by Coolify.

## Inputs
- **Codebase**: `soul_garden/backend` and `soul_garden/frontend`.
- **Secrets**: `.env` file containing Supabase and OpenAI keys.
- **Infrastructure**: Coolify instance on Contabo.

## Step-by-Step Procedure

### 1. Pre-Flight Check (Link Phase)
- Run `python tools/verify_link.py`. 
- Ensure all services return 200 OK.
- **Warning**: Ensure `SUPABASE_KEY` is the `service_role_key`.

### 2. Code Synchronization
- Commit all changes to the main branch.
- Push to the remote Git repository.

### 3. Coolify Configuration
- Create a "Docker Compose" resource in Coolify.
- Point to the `soul_garden/` directory (or the root if using a monorepo).
- Copy all `.env` variables into the Coolify "Environment Variables" tab.

### 4. Health Verification
- Once deployed, curl the `/health` endpoint.
- Verify status is `"healthy"`.

## Edge Cases & Failures
- **Port Conflicts**: Ensure port 8000 is not blocked by a firewall.
- **Version Mismatch**: If `pgvector` is not enabled in Supabase, the backend will fail to start. Enable it via `CREATE EXTENSION IF NOT EXISTS vector;`.
