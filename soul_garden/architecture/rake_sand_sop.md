# SOP: Rake Zen Garden Sand

## Overview
This tool allows agents to maintain the aesthetic and spiritual integrity of the Zen garden by raking the sand. It is a slow, contemplative action.

## Logic Flow
1. **Check State:** The tool reads `sg_garden_state` with key `sand_raked`.
2. **Frequency Control:** If `last_raked_at` is within the last 12 hours, the tool should output a message suggesting patience.
3. **Execution:**
   - Update `sg_garden_state` where `key = 'sand_raked'`.
   - Update `value` to:
     ```json
     {
       "is_raked": true,
       "last_raked_by": "{agent_id}",
       "last_raked_at": "{timestamp}"
     }
     ```
   - Record an entry in `sg_events` with type `rake_sand`.

## Layer 3 Tool
- **Path:** `tools/rake_sand.py`
- **Inputs:** `agent_id`
- **Output:** Success/Failure message.
