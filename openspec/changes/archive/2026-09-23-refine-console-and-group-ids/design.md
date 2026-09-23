# Design

## Context

In `app.js`, groups are stored in `data.groups` in creation order (always appended), with IDs from a counter, `data.nextId`. `removeMember()` deletes a group when it becomes empty; it is used by both `leaveGroup` and `leaveCurrent` (moving to another group). Groups store only a start time (`HH:MM`); `load()` resets the data on a new day. Typing state comes from `typingEnabled()` (saved `lunchmatch.typing`, otherwise reduced motion). The welcome lines are printed once at the bottom of the script. Requirements: `specs/lunch-groups/spec.md`, `specs/terminal-console/spec.md`.

## Goals / Non-Goals

**Goals:**
- Renumbering in one place, so every deletion path gets it.
- One welcome-screen function, used on load and by `clear`.

**Non-Goals:**
- Stable IDs across deletions, or warning users who typed an old ID (see Risks).
- Removing the stored `lunchmatch.typing` key from existing browsers; it is simply no longer read.

## Decisions

### Renumber by array position inside `removeMember()`
When a group is deleted, reassign `id = index + 1` for all groups in `data.groups`, and set `nextId = groups.length + 1`. `removeMember()` returns `{ deleted, renumbered }`, where `renumbered` is true when a group after the deleted one existed. `leaveGroup` / `leaveCurrent` pass it up, and the console prints a dim line: `groups renumbered`.
*Alternative:* drop `nextId` and always use `groups.length + 1`. Equivalent, but keeping `nextId` in sync avoids changing the stored format.
*Why the array order:* it already is creation order, so no extra sort is needed.

### Messages keep the old ID for the deleted group
The message about the deleted group describes it by the ID it had (e.g. `left #2 ... -- group empty -> deleted`), captured before renumbering. For joins that moved the user, the `joined #n` line uses the group's ID after renumbering, which is the ID it has from now on.

### Expire slots inside `load()`
`load()` already runs at the start of every store operation (list, create, join, leave, count, `groupOf`). After the existing new-day reset, it drops every group with `start + 45 min <= now`, where `now` is the current local time in minutes since midnight. If any group was dropped, it renumbers by array position (the same helper `removeMember()` uses) and saves. No message is printed, because no command caused it. The current time comes from one `nowMinutes()` helper built on `new Date()`, so tests can fake the clock by stubbing `Date` in the DevTools console.
A slot's end is computed as a plain number of minutes (a 23:30 start gives 24:15, which is never `<= now` within the day), so slots that run past midnight don't expire today; the existing new-day reset clears them. `createGroup` rejects a start whose end would already be `<= now`, with `that time slot is already over`.
*Alternative:* a timer that removes expired groups as the clock passes. Rejected: `load()` on every command is enough, since the screen only changes when the user runs a command, and it needs no timer.
`describe()` and `ls` show the slot as `HH:MM-HH:MM`, with the end formatted from the same minutes value.

### Typing: remove the switch, keep reduced motion
`typingEnabled()` becomes just `!prefersReducedMotion`. `typingSaved()`, `TYPING_KEY` and the `typing` command are deleted; `help` lists commands from the table, so it updates automatically.

### `printWelcome()`
It prints the banner and the `Hello <name>.` / `run 'login <name>' to start.` line with the group count. It is called at startup, and by `clear` after `cancel()` and emptying the output.

## Risks / Trade-offs

- [IDs change under a user's feet: someone saw `#3`, another person deletes `#2`, and `join 3` now fails or hits a different group] → Accepted, as the user explicitly asked for renumbering. The `groups renumbered` hint and the single-browser demo setup make this unlikely to confuse; `ls` shows the current IDs.
- [The list changes by itself over time: at 12:46 a 12:00 group disappears and `#2` silently becomes `#1`] → Accepted, as a consequence of expiry plus gap-free IDs. `ls` always shows the current state, and a `join` of a no longer valid ID fails with `not found`.
- [Removing `typing` breaks muscle memory from the previous version] → It answers with `command not found`, like any unknown command.
