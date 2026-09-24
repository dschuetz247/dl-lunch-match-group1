# Design

## Context

`index.html` has one `#screen` column (header, `#terminal` with `#output` and the prompt) that fills the page; `style.css` gives `html, body` the black screen background and puts the scanlines on `body::after`, over the whole page. In `app.js`, `print()` pushes lines onto `queue` and a `requestAnimationFrame` loop (`typeFrame`) types them; `flush()` writes everything, `cancel()` drops it, and a capture-phase `keydown` plus an `input` listener call `flush()` whenever `queue` isn't empty. `printNow()` is used for the echo. The approved look is the mockup `design/lunchmatch-frame.png` (its source HTML/SVG was built during the design review). Requirements are in `specs/monitor-frame/spec.md`.

## Goals / Non-Goals

**Goals:**
- Frame and drive in plain HTML/CSS plus inline SVG, with no image files, so they stay sharp at any size.
- The load pause and the light hook into the existing queue, so skip, `clear` and reduced motion keep working through the paths that already exist.

**Non-Goals:**
- Animating the lever, sounds, or making the drive clickable.
- Changing anything on the screen itself (fonts, colors, typing speed, commands).

## Decisions

### Layout: the case is the page's flex column
`body` becomes the dark "desk" (`#141412`) and centers a `.case` that takes the viewport height minus a margin (up to a max width of about 1100 px). Inside the case, a flex column holds the `.bezel` (`flex: 1`, containing the existing `#screen`) and a fixed-height `.case-footer` (logo, power light, drive). `#screen` keeps its internal flex layout, so `#terminal` stays the only scrolling element. The screen's black background and text styles move from `html, body` to `#screen`, and the scanlines move from `body::after` to `#screen::after` (still `pointer-events: none`), so the case stays clean.
*Alternative:* a fixed-size monitor scaled with `transform`. Rejected: it blurs text and fights the responsive layout.

### Drive as inline SVG from the mockup
The drive plate is the mockup's 240×64 SVG (plate, activity light `#drive-led`, centered rounded recess, slot, closed lever with the pivot knob), inlined in `index.html` with `aria-hidden="true"`. The light's colors are driven by a CSS class (`.on` → `#33ff33`, off → `#aaa89c`), so JavaScript only toggles a class.

### Load pause: a `holdUntil` timestamp on the queue
When `print()` adds a line to an **empty** queue (the start of a block, since Enter always flushes first), it sets `holdUntil = now + random(250, 450)`. `typeFrame` writes nothing while `now < holdUntil`, and just requests the next frame. Every line printed while the queue is busy belongs to the same block. `flush()` ignores the hold and writes everything, and `cancel()` resets it, so skip and `clear` need no new code paths. With reduced motion, `print()` already bypasses the queue, so there's no hold.
*Alternative:* delay the whole `execute()` with `setTimeout`. Rejected: the command would run late, the header would update late, and skipping would need its own handling.

### Drive light: a random `setTimeout` loop tied to "queue not empty"
`setDriveActive(true)` is called when the first line enters the queue, and `setDriveActive(false)` when the queue empties (end of `typeFrame`, `flush()`, `cancel()`). While active, a `setTimeout` chain toggles `.on`, and each step picks its next delay: when lit, 20% chance of 120–260 ms, otherwise 15–70 ms; when dark, 15% chance of 90–200 ms, otherwise 10–60 ms. Going inactive clears the timer and turns the light off. `printNow()` never touches it, so the echo doesn't light it.

### 80-column screen
From 700 px width up, `#header` and `#terminal` get `min-width: 80ch` (in the screen font), and the case grows to fit the screen instead of the other way round. If the window is too narrow for 80 columns at the normal size, the screen font shrinks with a `clamp()` based on the viewport width (not below about 14 px), so 80 columns still fit. The exact factor depends on the measured `ch` width of VT323 and is set during implementation. `renderHeader()` writes the header as two spans (system/date part and `user: <name>`). Below 700 px, `min-width` is dropped and the user span becomes a block, so it gets its own line.
*Alternative:* scaling the whole frame with `transform`. Rejected, as above.

### Scrollbar: a custom element next to `#terminal`
Browsers can't draw a native scrollbar in this style consistently (Firefox hardly allows styling it), so `#terminal` keeps doing the actual scrolling with its native scrollbar hidden (`scrollbar-width: none` and `::-webkit-scrollbar { display: none }`). A `.scrollbar` element sits in a flex row to its right: a box with a 1 px `var(--fg)` border and an absolutely positioned `.thumb` with a small inset. `renderScrollbar()` hides the box when `scrollHeight <= clientHeight`, and otherwise sets the thumb height to `clientHeight / scrollHeight` of the track (with a minimum) and its top to the scroll ratio. It runs on `scroll`, on `resize`, and at the end of each `typeFrame`/`flush()`/`cancel()`. Mouse handling: `mousedown` on the thumb starts a drag that maps mouse movement to `scrollTop`, and on the box above or below the thumb it pages. Both call `preventDefault()`, so focus stays in the prompt.

### Page Up / Page Down
They're handled in the prompt's existing `keydown` listener: `terminalEl.scrollTop ± (clientHeight − one line height)`, with `preventDefault()` so the input's text and cursor stay unchanged. Because of the existing capture-phase "any key" listener, pending output is flushed first, so paging always works on complete output. The `help` command prints the hint after its command list: `keys:` (bright), `  PgUp / PgDn`, and `      scroll the output one page up / down` (dim).

### Small screens
Below 600 px width: smaller case padding and corners, bezel padding reduced, the logo hidden, and the drive scaled down (SVG width about 150 px). The scrollbar keeps its width. Below that, the existing `font-size: 18px` rule stays.

## Risks / Trade-offs

- [Every answer now arrives about 0.35 s later] → Intended, as it's the effect the user asked for. Any key skips it, and the echo still appears instantly, so input never feels ignored.
- [The case takes space, leaving fewer lines on the screen] → The footer is kept to a fixed height of about 90 px, and on phones the frame shrinks.
- [80 columns at the full 22 px VT323 size need roughly 900 px or more of width] → The font shrinks with `clamp()` between 700 px and that width; below 700 px the header and lines wrap instead.
- [Page Up / Page Down also finish pending output, because of the "any key" rule] → Consistent: the output is complete first, and then you page through it.
- [New output always jumps to the bottom, even if the user scrolled up to read] → Accepted, and unchanged from today; it's what a real terminal does.
- [Existing tests of timing (e.g. `help` taking about 2.6 s) now include the pause] → The typewriter speed itself is unchanged; the "about" wording in the terminal-console spec still holds.
