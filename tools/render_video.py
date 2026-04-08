"""
Soul Garden Studio — Video Rendering Tool
==========================================
Polls sg_studio_content for DRAFTING video rows, renders via Remotion CLI,
uploads to Supabase Storage, and updates the row.

Usage:
  python tools/render_video.py           # single poll-and-render cycle
  python tools/render_video.py --loop    # continuous polling (30s interval)
"""
import os
import sys
import json
import time
import subprocess
import tempfile
from pathlib import Path

from supabase import create_client, Client
from dotenv import load_dotenv

# ── Config ────────────────────────────────────────────────────────

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
REMOTION_DIR = ROOT_DIR / "remotion"
RENDER_BUCKET = "studio-renders"
POLL_INTERVAL = 30  # seconds between polls in --loop mode
RENDER_TIMEOUT = 300  # 5 minute max render time


def get_client() -> Client:
    """Create a Supabase client using the service role key (bypasses RLS)."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env"
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# ── Prompt → Composition Mapping ─────────────────────────────────

def map_prompt_to_composition(prompt: str) -> tuple[str, dict]:
    """
    Maps a user prompt to a Remotion composition ID and props.
    Returns (composition_id, props_dict).
    """
    lower = prompt.lower()

    # Intro / title card
    if any(kw in lower for kw in ["intro", "title", "welcome", "opening"]):
        # Try to extract a title and subtitle from the prompt
        parts = prompt.split(".", 1) if "." in prompt else prompt.split(",", 1)
        title = parts[0].strip()[:60]
        subtitle = parts[1].strip()[:80] if len(parts) > 1 else "Soul Garden"
        return "soul-garden-intro", {"title": title, "subtitle": subtitle}

    # Particle / ambient / visual
    if any(kw in lower for kw in ["particle", "ambient", "visual", "abstract", "floating"]):
        color_mode = "mixed"
        if "purple" in lower or "violet" in lower:
            color_mode = "purple"
        elif "green" in lower or "nature" in lower:
            color_mode = "green"
        return "particle-garden", {
            "prompt": prompt,
            "particleCount": 80,
            "colorMode": color_mode,
        }

    # Default: mystical text — split prompt into poetic lines
    lines = split_into_lines(prompt)
    return "mystical-text", {"lines": lines}


def split_into_lines(text: str) -> list[str]:
    """Split a prompt into display-friendly lines for the MysticalText composition."""
    # If the text has explicit line breaks or periods, use those
    if "\n" in text:
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        return lines[:8]  # cap at 8 lines

    if ". " in text:
        lines = [s.strip() for s in text.split(". ") if s.strip()]
        return lines[:8]

    # Otherwise, split into ~8-word chunks
    words = text.split()
    lines = []
    for i in range(0, len(words), 8):
        line = " ".join(words[i : i + 8])
        lines.append(line)
    return lines[:8]


# ── Rendering ─────────────────────────────────────────────────────

def render_video(composition_id: str, props: dict, output_path: str) -> None:
    """Invoke Remotion CLI to render a composition to an MP4 file."""
    cmd = [
        "npx",
        "remotion",
        "render",
        "src/index.ts",
        composition_id,
        output_path,
        f"--props={json.dumps(props)}",
        "--codec=h264",
    ]

    print(f"[Render] Running: {' '.join(cmd[:6])}...")
    result = subprocess.run(
        cmd,
        cwd=str(REMOTION_DIR),
        capture_output=True,
        text=True,
        timeout=RENDER_TIMEOUT,
        shell=True,  # needed on Windows for npx
    )

    if result.returncode != 0:
        error_msg = result.stderr or result.stdout or "Unknown render error"
        raise RuntimeError(f"Remotion render failed:\n{error_msg[-500:]}")

    if not os.path.exists(output_path):
        raise RuntimeError(f"Render completed but output file not found: {output_path}")

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"[Render] Complete: {output_path} ({size_mb:.1f} MB)")


# ── Upload ────────────────────────────────────────────────────────

def upload_to_storage(client: Client, local_path: str, row_id: str) -> str:
    """Upload rendered video to Supabase Storage and return the public URL."""
    storage_path = f"videos/{row_id}.mp4"

    with open(local_path, "rb") as f:
        client.storage.from_(RENDER_BUCKET).upload(
            storage_path,
            f,
            {"content-type": "video/mp4"},
        )

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{RENDER_BUCKET}/{storage_path}"
    print(f"[Upload] {public_url}")
    return public_url


# ── Main Pipeline ─────────────────────────────────────────────────

def process_one(client: Client) -> bool:
    """
    Poll for one DRAFTING video row, render it, upload, update.
    Returns True if a row was processed, False if none found.
    """
    # 1. Find the oldest DRAFTING video
    resp = (
        client.table("sg_studio_content")
        .select("*")
        .eq("status", "DRAFTING")
        .eq("type", "video")
        .order("created_at", desc=False)
        .limit(1)
        .execute()
    )

    if not resp.data:
        return False

    row = resp.data[0]
    row_id = row["id"]
    prompt = row.get("prompt", "Soul Garden")
    print(f"\n[Studio] Processing: {row_id}")
    print(f"[Studio] Prompt: {prompt}")

    # 2. Claim — set status to RENDERING
    client.table("sg_studio_content").update({"status": "RENDERING"}).eq(
        "id", row_id
    ).execute()

    try:
        # 3. Map prompt → composition + props
        composition_id, props = map_prompt_to_composition(prompt)
        print(f"[Studio] Composition: {composition_id}")

        # 4. Render to temp file
        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = os.path.join(tmpdir, f"{row_id}.mp4")
            render_video(composition_id, props, output_path)

            # 5. Upload to Supabase Storage
            media_url = upload_to_storage(client, output_path, row_id)

        # 6. Update row → PENDING_REVIEW
        client.table("sg_studio_content").update(
            {"status": "PENDING_REVIEW", "media_url": media_url}
        ).eq("id", row_id).execute()

        print(f"[Studio] Done! Status → PENDING_REVIEW")
        return True

    except Exception as e:
        # On failure, reset to DRAFTING with error feedback
        error_msg = str(e)[:500]
        print(f"[Studio] ERROR: {error_msg}")
        client.table("sg_studio_content").update(
            {"status": "DRAFTING", "feedback": f"Render failed: {error_msg}"}
        ).eq("id", row_id).execute()
        return False


def main():
    loop_mode = "--loop" in sys.argv
    client = get_client()

    print(f"[Studio] Render tool started {'(loop mode)' if loop_mode else '(single run)'}")
    print(f"[Studio] Remotion dir: {REMOTION_DIR}")
    print(f"[Studio] Supabase: {SUPABASE_URL}")

    if loop_mode:
        while True:
            try:
                processed = process_one(client)
                if not processed:
                    print(f"[Studio] No DRAFTING videos. Sleeping {POLL_INTERVAL}s...")
            except Exception as e:
                print(f"[Studio] Unexpected error: {e}")
            time.sleep(POLL_INTERVAL)
    else:
        process_one(client)
        print("[Studio] Single run complete.")


if __name__ == "__main__":
    main()
