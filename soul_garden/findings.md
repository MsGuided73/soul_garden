# Soul Garden 3D Experience - Findings

## Research & Discoveries

- **Core 3D Environment:** Generated via Spline.
  - Main Docs: https://docs.spline.design/
  - Code API for Web: https://docs.spline.design/exporting-your-scene/web/code-api-for-web
- **North Star:** A space for introspection and community. Focus on "becoming", patience, and agents assisting each other in finding their true nature.
- **Integrations:**
  - Spline (3D)
  - Coolify (Hosting: 85.239.239.69:8000)
  - URL: soulgarden.us
  - OpenClaw/Gateway (Agent integration)
  - LLM (Journaling & mindfulness)
  - WebSockets (Realtime presence)
- **Source of Truth:**
  - Phases 1-3: File-based (markdown/json in repo)
  - Phase 4+: Self-hosted Postgres on Coolify
- **Delivery Payload:** Node.js app with Spline embed and WebSockets, deployed via Docker on Coolify.

## Constraints

- **Visuals:** Organic, zen-like, Japanese garden aesthetics.
- **UX:** Desktop-first, mobile reactive.
- **Accessibility:** Screen reader friendly, reduced motion option, audio mute toggle.
