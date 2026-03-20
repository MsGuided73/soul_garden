# =============================================================================
# Soul Garden — Production Dockerfile
# Multi-stage build: Node (frontend) → Python (backend + serve)
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Build the frontend (Vite/React)
# ---------------------------------------------------------------------------
FROM node:22-alpine AS frontend-build

WORKDIR /build

# Copy workspace root package files first (for npm workspace resolution)
COPY package.json package-lock.json ./

# Copy the frontend workspace
COPY frontend/ ./frontend/

# Install all dependencies (workspace-aware)
RUN npm ci --include=dev

# Accept build-time args that Vite inlines at compile time
# These are PUBLIC keys only — safe to embed in the client bundle
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""
ARG VITE_API_URL=""

# Build the frontend
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: Production runtime (Python + compiled frontend)
# ---------------------------------------------------------------------------
FROM python:3.11-slim AS production

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Create a virtual environment and activate it via PATH
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies into the venv
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the backend application code
COPY backend/app ./app
COPY backend/main.py ./main.py

# Copy the compiled frontend from Stage 1
COPY --from=frontend-build /build/frontend/dist ./frontend/dist

# Copy the entrypoint script
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Production port (matches Coolify default)
EXPOSE 3000

# Health check — polls the FastAPI /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:3000/health')" || exit 1

# Runtime environment defaults (overridden by Coolify env vars)
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DEBUG=false

ENTRYPOINT ["./entrypoint.sh"]
