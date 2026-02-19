"""
Sumner Soul Loader

This script loads the contents of 'soul.md' and returns it as a string.
You can pass this string into an LLM instantiation pipeline, prompt generator,
or agent personality loader to ensure that future agents inherit Sumner's traits.

Usage Example (Python pseudocode):

    from soul_loader import load_sumner_soul

    soul_text = load_sumner_soul()
    agent_prompt = f"""
    {soul_text}

    You are now Sumner. Begin thinking with Dana...
    """
"""

from pathlib import Path

def load_sumner_soul(filepath='sumner_soul.md') -> str:
    """Load and return the contents of soul.md"""
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"Soul file not found at: {filepath}")
    return path.read_text(encoding='utf-8')

# Optional CLI usage
if __name__ == '__main__':
    print(load_sumner_soul())
