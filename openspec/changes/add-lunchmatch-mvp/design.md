# Design

## Context

The repo is empty. Motivation is in proposal.md; required behavior is in `specs/lunch-groups` and `specs/terminal-console`. Constraints: about 50 minutes of dev time, plain HTML/CSS/JS, no backend, a demo in a single browser.

## Goals / Non-Goals

**Goals:**
- Opens by double-clicking `index.html` (a `file://` URL); no server, no install, no build.
- Keep the group logic separate from the terminal UI, so a server could replace `localStorage` later without rewriting the console.

**Non-Goals:**
- Automated test tooling, bundlers, frameworks, TypeScript.
- Pixel-perfect CRT emulation (curvature, flicker).
- Mobile-optimized input.

## Decisions

### Three files, two script sections
`index.html` (markup), `style.css` (look), `app.js` split into a **store** part (groups: load, save, create, join, leave, list/filter, purge old days) and a **console** part (input, history, parsing, rendering, commands). Plain `<script>` tag, no ES modules, because modules are blocked on `file://` in some browsers.
*Alternative:* one single HTML file. It's slightly simpler, but harder for several people to edit in parallel in 50 minutes.

### Data model in localStorage
One key, `lunchmatch`, holding `{ day: "YYYY-MM-DD", nextId: 1, groups: [{ id, time, food, place, members: [] }] }`, plus a key `lunchmatch.user` for the current login. On load, if `day` isn't today's local date, the data is reset (this deletes old days). IDs count up within a day, so they stay short to type (`join 2`).
*Alternative:* one entry per group. That's more code for no benefit at this size.

### Command parsing
Split the input line into tokens with a small regex that keeps `"quoted strings"` together; the first token is the command, `--flag value` pairs are options. A command table maps names to `{ usage, description, run(args, opts) }`, so `help` and usage errors are generated from the same table.
*Alternative:* a parser library. It would be a dependency, and it's overkill.

### Rendering
Output is a scrollable `<div>` of lines appended with `textContent` (never `innerHTML`), so user-entered names and places can't inject HTML. Tables are padded with `padEnd` in a monospace font. It auto-scrolls to the bottom after each command.

### Look
Font: `VT323` from Google Fonts, falling back to `monospace`, so it still works offline. Colors are CSS variables: `--fg: #33ff33`, `--fg-dim: #1f9e1f`, `--fg-bright: #b6ffb6`, `--bg: #000` (or a very dark green, `#020a02`). A light `text-shadow` gives the glow; a `repeating-linear-gradient` overlay with `pointer-events: none` gives the scanlines. The block cursor is a CSS `@keyframes` blink. The real `<input>` has no border or background, so the prompt looks like terminal text.

## Risks / Trade-offs

- [Data exists in one browser only; different laptops don't see each other's groups] → Accepted for the MVP; the demo switches users with `login`. The store/console split leaves room for a backend later.
- [Anyone can `login` as anyone, with no authentication] → Accepted; this is a trust-based office tool.
- [The Google Font can't load offline] → The `monospace` fallback keeps it usable.
- [The glow or scanlines reduce readability] → Keep them faint (glow radius ~4px, scanline opacity ≤ 0.15).
- [50 minutes is tight] → Task order in tasks.md builds a working core first (`login`, `new`, `ls`, `join`, `leave`); filters, history and CRT effects come last and can be dropped.
