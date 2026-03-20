#!/bin/sh
# =============================================================================
# Soul Garden — Production Entrypoint
# Starts the FastAPI backend which also serves the compiled frontend
# =============================================================================

set -e

PORT="${PORT:-3000}"
WORKERS="${WORKERS:-2}"

echo "================================================="
echo "  🌱 Soul Garden — Starting Production Server"
echo "  Port: ${PORT}"
echo "  Workers: ${WORKERS}"
echo "================================================="

exec uvicorn main:app \
    --host 0.0.0.0 \
    --port "${PORT}" \
    --workers "${WORKERS}" \
    --access-log \
    --proxy-headers \
    --forwarded-allow-ips='*'
