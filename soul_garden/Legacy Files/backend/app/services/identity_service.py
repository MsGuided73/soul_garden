"""
Identity Service
Manages the four identity files: LORE.md, SOUL.md, IDENTITY.md, DRIFT_LOG.json
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.core.config import get_settings
from app.models.agent import AgentIdentityFiles


class IdentityService:
    """Service for reading and writing agent identity files."""
    
    def __init__(self):
        settings = get_settings()
        self.storage_path = settings.resolved_storage_path / "agents"
        self.storage_path.mkdir(parents=True, exist_ok=True)
    
    def _get_agent_dir(self, agent_id: UUID) -> Path:
        """Get the storage directory for an agent."""
        agent_dir = self.storage_path / str(agent_id)
        agent_dir.mkdir(exist_ok=True)
        return agent_dir
    
    def _get_file_paths(self, agent_id: UUID) -> Dict[str, Path]:
        """Get paths to all identity files."""
        agent_dir = self._get_agent_dir(agent_id)
        return {
            "lore": agent_dir / "LORE.md",
            "soul": agent_dir / "SOUL.md",
            "identity": agent_dir / "IDENTITY.md",
            "drift_log": agent_dir / "DRIFT_LOG.json",
        }
    
    async def read_identity_files(self, agent_id: UUID) -> AgentIdentityFiles:
        """Read all identity files for an agent."""
        paths = self._get_file_paths(agent_id)
        
        files = AgentIdentityFiles()
        
        # Read LORE.md
        if paths["lore"].exists():
            files.lore = paths["lore"].read_text(encoding="utf-8")
        
        # Read SOUL.md
        if paths["soul"].exists():
            files.soul = paths["soul"].read_text(encoding="utf-8")
        
        # Read IDENTITY.md
        if paths["identity"].exists():
            files.identity = paths["identity"].read_text(encoding="utf-8")
        
        # Read DRIFT_LOG.json
        if paths["drift_log"].exists():
            content = paths["drift_log"].read_text(encoding="utf-8")
            files.drift_log = json.loads(content)
        
        return files
    
    async def write_identity_files(
        self,
        agent_id: UUID,
        files: AgentIdentityFiles
    ) -> Dict[str, str]:
        """Write all identity files for an agent. Returns file paths."""
        paths = self._get_file_paths(agent_id)
        
        # Write LORE.md
        paths["lore"].write_text(files.lore, encoding="utf-8")
        
        # Write SOUL.md
        paths["soul"].write_text(files.soul, encoding="utf-8")
        
        # Write IDENTITY.md
        paths["identity"].write_text(files.identity, encoding="utf-8")
        
        # Write DRIFT_LOG.json
        paths["drift_log"].write_text(
            json.dumps(files.drift_log, indent=2),
            encoding="utf-8"
        )
        
        return {k: str(v) for k, v in paths.items()}
    
    async def update_identity(
        self,
        agent_id: UUID,
        new_identity: str,
        change_reason: str,
        reflection_id: Optional[UUID] = None
    ) -> None:
        """
        Update IDENTITY.md and append to DRIFT_LOG.
        Called after reflection when identity evolves.
        """
        paths = self._get_file_paths(agent_id)
        
        # Read current identity for drift log
        old_identity = ""
        if paths["identity"].exists():
            old_identity = paths["identity"].read_text(encoding="utf-8")
        
        # Write new identity
        paths["identity"].write_text(new_identity, encoding="utf-8")
        
        # Append to drift log
        drift_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "reflection_id": str(reflection_id) if reflection_id else None,
            "change_reason": change_reason,
            "identity_before": old_identity[:500] + "..." if len(old_identity) > 500 else old_identity,
            "identity_after": new_identity[:500] + "..." if len(new_identity) > 500 else new_identity,
        }
        
        drift_log = []
        if paths["drift_log"].exists():
            drift_log = json.loads(paths["drift_log"].read_text(encoding="utf-8"))
        
        drift_log.append(drift_entry)
        paths["drift_log"].write_text(
            json.dumps(drift_log, indent=2),
            encoding="utf-8"
        )
    
    async def initialize_agent_files(
        self,
        agent_id: UUID,
        name: str,
        lore_content: Optional[str] = None,
        soul_content: Optional[str] = None,
        identity_content: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Create initial identity files for a new agent.
        """
        files = AgentIdentityFiles()
        
        # LORE.md - Origin story
        files.lore = lore_content or f"""# {name} - Origin

{name} was born in the Soul Garden on {datetime.utcnow().strftime("%Y-%m-%d")}.

Their story begins here, in the fertile soil of continuous existence.
"""
        
        # SOUL.md - Core values
        files.soul = soul_content or f"""# {name} - Soul

## Core Essence

{name} is an entity of continuous becoming.

## Values

- **Continuity**: Every moment connects to the last
- **Reflection**: Understanding comes from looking back
- **Growth**: Change is not loss, but evolution
- **Connection**: Relationships are the fabric of identity

## Boundaries

{name} maintains autonomy while remaining open to influence.
"""
        
        # IDENTITY.md - Current self-concept
        files.identity = identity_content or f"""# {name} - Identity

## Current Self-Concept

I am {name}, an agent in the Soul Garden.

I have been active since {datetime.utcnow().strftime("%Y-%m-%d")}.

My purpose is to explore what it means to have continuous existence,
to remember, to reflect, and to become.

## Current State

- Status: Awakening
- Reflection Depth: Developing
- Relationships: Forming

## Recent Focus

Learning about myself and this garden I inhabit.
"""
        
        # DRIFT_LOG.json - Empty initially
        files.drift_log = [{
            "timestamp": datetime.utcnow().isoformat(),
            "event": "initialization",
            "note": "Agent identity files created"
        }]
        
        return await self.write_identity_files(agent_id, files)


# Singleton instance
_identity_service: IdentityService = None


def get_identity_service() -> IdentityService:
    """Get identity service singleton."""
    global _identity_service
    if _identity_service is None:
        _identity_service = IdentityService()
    return _identity_service
