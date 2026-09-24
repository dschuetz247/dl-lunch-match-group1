# Proposal

## Why

The terminal already looks like a green monochrome screen, but it floats on a black page. Putting it inside the case of an old compact all-in-one computer completes the illusion. A working floppy drive light, plus a short "loading from disk" pause, makes the app feel like it's really reading data before it answers.

## What Changes

- The app is shown inside the frame of an old compact all-in-one computer, following the approved mockup `design/lunchmatch-frame.png`:
  - A yellowed beige case with rounded corners.
  - A recessed screen bezel.
  - A `LunchMatch` logo and a green power light below the screen.
  - A 5¼″ floppy drive front plate with the drive closed.
- The drive's activity light flickers at random whenever the app is producing output.
- Before each block of output (a command's result, or the welcome screen), there is a short random "disk load" pause of 250–450 ms: the light already flickers, but nothing is printed yet. Then the text types out while the light keeps flickering, and the light goes dark when the output is done.
- A key press skips the load pause just like it skips the typing.
- With reduced motion, there is no pause, output stays instant and the drive light stays off.
- The screen is at least 80 characters wide on desktops, so user names of up to 22 characters always fit in the header. On narrow screens (below 700 px) the header shows the user on its own line and long lines wrap.
- When the output doesn't fit on the screen, a vintage scrollbar appears on the right (a green outlined box with a solid thumb). Page Up / Page Down scroll the output page by page, and `help` ends with a hint for these keys.
- Everything else on the screen stays the same, and everything keeps working inside the frame. On phones the frame gets thinner.

## Capabilities

### New Capabilities
- `monitor-frame`: the computer case around the screen, the 80-column screen width, the vintage scrollbar with Page Up / Page Down paging (and its hint in `help`), the floppy drive front plate, the drive activity light, the disk-load pause before output, and how the frame adapts to small screens.

### Modified Capabilities
<!-- none: the terminal-console requirements stay valid; the load pause counts as pending output, so "any key finishes pending output" already covers skipping it; the paging hint is added to help's output without changing its command list. Shortening user names to 22 characters is a separate change. -->

## Impact

- `index.html`: markup for the case, bezel, logo, power light, drive (inline SVG) and the screen scrollbar.
- `style.css`: frame styles, page background around the case, scanlines limited to the screen, 80-column screen width, hidden native scrollbar, scrollbar styles, small-screen rules.
- `app.js`: disk-load pause before a block of queued output, the random flicker of the drive light tied to pending output, scrollbar drawing and mouse handling, Page Up / Page Down, the paging hint in `help`, and the header layout on narrow screens.
- `design/lunchmatch-frame.png` (reference mockup) is added to the repo. No new dependencies.
