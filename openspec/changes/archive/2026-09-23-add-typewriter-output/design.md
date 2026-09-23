# Design

## Context

In `app.js`, `print(text, cls)` creates a `.line` div and sets `textContent` in one step. `submit()` echoes the command, runs it, then scrolls `#terminal` to the bottom once. `clear` empties `#output` directly. Requirements are in `specs/terminal-console/spec.md`.

## Goals / Non-Goals

**Goals:**
- Keep every call site of `print()` unchanged, so the effect sits in one place.
- Never block input: typing and history work while output is being written.

**Non-Goals:**
- Typing sound, variable or random speed, or animating the header or the user's own echo.

## Decisions

### Queue + animation-frame loop inside `print()`
`print()` still creates the line element immediately, but empty, and pushes `{ el, text }` onto a queue. A `requestAnimationFrame` loop types the head of the queue: each frame it computes how many characters are due from elapsed time (`elapsed / 2ms`), appends them to `el.textContent`, and moves to the next line when one is done. It scrolls `#terminal` to the bottom after each frame.
*Why not `setTimeout(2ms)` per character:* browsers clamp timers to about 4 ms or more, and one timer per character is wasteful. A time-based rAF loop keeps a real ~2 ms per character (around 8 characters per frame at 60 Hz) and pauses on its own in background tabs.
*Why create the empty element up front:* line order and CSS classes are fixed when `print()` is called, so interleaving can't happen.

### Instant path = the same queue, flushed
`flush()` writes the remaining text of every queued line and empties the queue. With typing off, `print()` sets the text directly and skips the queue. The echo line in `submit()` goes through a small `printNow()` (the current `print()` logic) so it is always instant.

### Keypress handling
A `keydown` listener on `document`, registered in the capture phase, calls `flush()` whenever the queue isn't empty. It doesn't call `preventDefault`, so the key still reaches the input. Because Enter also triggers a flush before `submit()` runs, a new command's echo always appears below the complete earlier output. That satisfies the queueing rule with no extra ordering logic.

### `clear`
It empties the queue (drops pending lines without writing them) before emptying `#output`.

### Setting and reduced motion
`lunchmatch.typing` in localStorage stores `"on"` / `"off"` through the existing `storageGet`/`storageSet` helpers. The effective state is: the saved value if there is one, otherwise `!matchMedia("(prefers-reduced-motion: reduce)").matches`. An explicit `typing on` overrides reduced motion, because the user asked for it. `typing` with no argument prints `typing: on|off`, plus `(default)` when nothing is saved.

## Risks / Trade-offs

- [Long outputs such as `help` take time] → At 2 ms per character, `help` (~600 characters) takes about 1.2 s. Any key skips it, and `typing off` exists.
- [Automated or scripted checks read the output before it's finished] → Press a key or use `typing off` first; tests can call `flush` via the console.
- [Scrolling every frame fights a user scrolling up to read] → Accepted for the MVP. Only scroll while the queue is active, which ends quickly.
