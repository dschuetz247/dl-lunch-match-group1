# Proposal

## Why

Five refinements after trying the app:
- The typewriter effect is too fast to notice.
- Group IDs leave gaps after deletions (e.g. `#1, #3, #4`), which looks sloppy in a short list.
- The `typing on|off` switch isn't wanted: the effect is part of the app's character.
- `clear` leaves a blank screen, instead of the start screen with a personal greeting.
- Groups stay listed after lunch is over, so the list fills up with groups nobody can join anymore.

## What Changes

- Typewriter output is twice as slow: about 4 ms per character instead of about 2 ms.
- **BREAKING (UI):** the `typing [on|off]` command is removed, and any saved typing choice is ignored. Output is always typed, except when the system requests reduced motion, where it stays instant.
- Group IDs are always `1..n` in creation order. When a group is deleted, the groups after it move down by one, and a new group gets `n+1`. A group gets deleted when its last member leaves, when its last member moves to another group, or when its slot ends. The user is told about renumbering caused by their own command.
- Each group is a 45-minute lunch slot, from its start time to start + 45 minutes. Start times stay in 15-minute steps. `ls` shows the slot as a range (e.g. `12:00-12:45`).
- Once a slot has ended, the group is no longer shown or counted: it is deleted, and the remaining groups are renumbered. Groups that have started but not ended stay visible and joinable. Creating a group whose slot is already over is rejected.
- A welcome screen is shown on load and again after `clear`: the `LUNCHMATCH/OS` banner line, then `Hello <name>. N groups today.` when logged in, or `run 'login <name>' to start. N groups today.` when not. This replaces the current `welcome back, <name>.` wording.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `lunch-groups`: adds gap-free group numbering and 45-minute lunch slots (including removing expired groups); "Create a group" rejects slots that are already over; "List and filter groups" shows start and end time.
- `terminal-console`: the typewriter speed changes and it can no longer be switched off (except by reduced motion); `typing` is removed from the command set; `clear` shows the welcome screen; `ls` shows the slot range; adds a welcome-screen requirement.

## Impact

- `app.js`: group store (renumbering after deletion, removing expired groups when data is loaded, rejecting slots that are already over), typing speed and on/off state, `typing` command removed, welcome screen extracted and reused by `clear`, messages when groups are renumbered, `ls` TIME range.
- Existing `lunchmatch.typing` values in localStorage become unused (harmless).
- Stored groups keep their data; IDs change on the next deletion, including groups expiring.
