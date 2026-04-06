# ============================================
# Soul Garden — Production Dockerfile
# Static frontend served by nginx
# ============================================

# ── Stage 1: Build the frontend ──────────────
FROM node:22-slim AS build
WORKDIR /app

# Copy workspace root + frontend package files for dependency install
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/

# Install dependencies (ignoring the Windows lockfile to force raw Linux binaries)
# --legacy-peer-deps needed because react-chessboard@5 peers on React 19 but we use React 18
RUN rm -f package-lock.json && npm install --legacy-peer-deps

# Copy frontend source
COPY frontend/ frontend/

# Build-time args for Supabase (these are public client keys)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Build the frontend
RUN npm run build

# ── Stage 2: Serve with nginx ────────────────
FROM nginx:alpine

# Copy built frontend to nginx html directory
COPY --from=build /app/frontend/dist /usr/share/nginx/html

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the Coolify-expected port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
