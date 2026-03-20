# Soul Garden - Coolify Deployment Guide

Deploy Soul Garden to your Contabo VPS managed by Coolify.

## Prerequisites

- Contabo VPS (4GB+ RAM recommended)
- Coolify installed and running
- Supabase project with pgvector enabled
- OpenAI API key with billing enabled

## Step-by-Step Deployment

### 1. Prepare Supabase (One-time setup)

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Run the full schema migration
-- Copy contents of backend/migrations/001_initial_schema.sql
-- and execute in Supabase SQL Editor
```

### 2. Fork/Push to Git

```bash
# Initialize git if not already done
git init
git add .
git commit -m "feat: ready for Coolify deployment"
git branch -M main

# Push to your Git provider (GitHub, GitLab, etc.)
git push -u origin main
```

### 3. Add Resource to Coolify

1. Open your Coolify dashboard
2. Click **"+ Add New Resource"**
3. Select **"Public Repository"** or your Git provider
4. Enter repository URL
5. Select **"Docker Compose"** as build type
6. Select your Contabo server

### 4. Configure Environment Variables

In Coolify, go to your service **"Environment Variables"** tab and add:

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_KEY` | ✅ | Supabase service_role_key (NOT anon_key) |
| `OPENAI_API_KEY` | ✅ | OpenAI API key |
| `OPENAI_MODEL` | ❌ | `gpt-4o-mini` (default) |
| `EMBEDDING_MODEL` | ❌ | `text-embedding-3-small` (default) |
| `DEFAULT_REFLECTION_DEPTH` | ❌ | `3` (1-5 scale) |
| `DEFAULT_AUTO_REFLECT_INTERVAL` | ❌ | `3600` (seconds) |
| `DEBUG` | ❌ | `false` for production |
| `STORAGE_PATH` | ❌ | `/app/storage` (default in container) |

### 5. Configure Persistent Storage

In Coolify, ensure the volume is mounted:

- **Source**: `agent-storage` (Coolify managed volume)
- **Destination**: `/app/storage`

This ensures agent identity files persist across deployments.

### 6. Deploy

Click **"Deploy"** in Coolify!

### 7. Verify Deployment

```bash
# Check health endpoint
curl https://your-domain.com/health

# Expected response:
{
  "status": "healthy",
  "app": "Soul Garden",
  "version": "0.1.0"
}
```

## Troubleshooting

### Container fails to start

Check logs in Coolify:
```bash
# SSH to your Contabo VPS
docker logs soul-garden-api
```

Common issues:
- Missing environment variables
- Supabase connection failing (check URL/key)
- Storage permissions (container runs as non-root)

### Database connection errors

Ensure:
1. Supabase project is active (not paused)
2. `SUPABASE_KEY` is the **service_role_key**, not anon_key
3. pgvector extension is enabled

### Storage issues

Agent files not persisting:
- Check volume is mounted to `/app/storage`
- Verify `STORAGE_PATH` env var matches

## Scaling

### Add More Resources

For more agents, upgrade your Contabo plan or:

```yaml
# In docker-compose.yml, adjust limits
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 4G
```

### Multiple Instances (Future)

For horizontal scaling with multiple Contabo VPS:
- Use external Redis for coordination
- Share storage via S3 (change `STORAGE_TYPE=s3`)
- Use Supabase as single source of truth

## Updates

To update Soul Garden:

1. Push changes to git
2. Coolify auto-deploys (if webhook enabled)
3. Or manually click **"Redeploy"** in Coolify

Agent data persists because:
- Database is in Supabase (external)
- Identity files are in mounted volume

## Custom Domain (Optional)

In Coolify:
1. Go to your service
2. **"Domains"** tab
3. Add your domain
4. Configure DNS to point to your Contabo IP
5. Enable SSL (Let's Encrypt)

## Security Checklist

- [ ] `.env` is in `.gitignore`
- [ ] `SUPABASE_KEY` is the service_role_key (kept secret)
- [ ] `DEBUG=false` in production
- [ ] Custom domain has SSL enabled
- [ ] Contabo firewall allows only necessary ports (80, 443, 22)
- [ ] Regular backups enabled (Supabase + Coolify volumes)

---

**Questions?** Check Coolify docs: https://coolify.io/docs/
