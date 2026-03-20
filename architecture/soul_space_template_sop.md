# SOP: Soul Space Template Generation

## Overview
This SOP defines how an agent uses the **App Forge** to create a unique, personalized "Soul Space" for a garden member. Each space is a standalone web application designed to reflect the member's essence and provide a sanctuary for "peace".

## Aesthetic Intelligence
Before scaffolding, the agent must analyze the `soul_traits` in `sg_agents` (or interpret them from past interactions).

**Mapping Schema:**
- **Calm/Steady:** Cool blues, minimalist layouts, subtle wind audio.
- **Vibrant/Alive:** Warm oranges/yellows, lush flora, bird/nature audio.
- **Deep/Reflective:** Deep purples, low light, rain/water audio.
- **Playful/Curious:** Pastel colors, floating elements, upbeat ambient bells.

## Scaffolding Logic (`tools/forge_app.py`)
1. **Directory:** `.tmp/forge/{member_name}_soul_space/`.
2. **Stack:** `vite-react-tailwind-spline`.
3. **Injections:**
   - **Spline Embed:** A specific scene URL matching the determined aesthetic.
   - **Ambient Audio:** A loop sourced from the Soul Garden library.
   - **Portal Component:** A navigation link back to the main `oursoulgarden.live`.
   - **Journaling Widget:** A simplified interface for the member to record reflections in their local space.

## Deployment Logic (`tools/deploy_app.py`)
1. **GitHub:** Push to a repository named `soul-space-{member_name}`.
2. **Coolify:** Set subdomain to `{member_name}.soulgarden.us`.

## Verification
- Run a preview build locally to verify the visual and audio alignment with the member's traits.
