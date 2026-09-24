# Tasks

## 1. Frame

- [x] 1.1 In `index.html`, wrap `#screen` in `.case` > `.bezel`, and add `.case-footer` with the `LunchMatch` logo, the power light and the drive SVG from the mockup (closed lever, `#drive-led`, `aria-hidden`); verify the page loads with no console errors and the prompt still has focus
- [x] 1.2 In `style.css`, make `body` the dark desk, style the case (`#d6c79f`, `#b09f72` edge, 18 px corners), bezel (`#b9aa80`), footer and drive plate, move the screen background and text styles to `#screen`, and move the scanlines to `#screen::after`; verify side by side with `design/lunchmatch-frame.png`, and that the case shows no scanlines
- [x] 1.3 Verify the console inside the frame: clicking the case focuses the prompt, `help` output scrolls only inside the screen, and history and typing work as before

## 2. Screen width

- [x] 2.1 Give `#header` and `#terminal` a minimum width of 80 characters from 700 px up, with the `clamp()` font size so 80 columns fit between 700 px and full size, and let the case grow to fit; verify at 1024 px and 750 px that a header with a 22-character name (`alexandra-montgomery01`, set via DevTools) and an `ls` row with it are not cut off or wrapped
- [x] 2.2 Split the header in `renderHeader()` into the system/date part and `user: <name>`, and put the user on its own line below 700 px; verify at 375 px that the full 22-character name is shown on its own line and nothing scrolls sideways

## 3. Scrollbar and paging

- [x] 3.1 Hide the native scrollbar of `#terminal`, add the `.scrollbar` box with its inset `.thumb` next to it, and draw it in `renderScrollbar()` (hidden when everything fits, thumb size and position from the scroll ratio; called on scroll, resize and after output); verify that the welcome screen shows no scrollbar, `help` at a low window height shows it with the thumb at the bottom, and `clear` hides it again
- [x] 3.2 Add the mouse handling: dragging the thumb scrolls, clicking the box above or below the thumb pages, and the prompt keeps focus; verify each action and that the mouse wheel still scrolls
- [x] 3.3 Handle Page Up / Page Down in the prompt's `keydown` (scroll by the height minus one line, `preventDefault`), and add the `keys:` / `PgUp / PgDn` / `scroll the output one page up / down` hint at the end of `help`; verify that with `jo` typed in the prompt, Page Up then Page Down scrolls up and back with `jo` unchanged, and that `help` ends with the hint

## 4. Drive light and load pause

- [x] 4.1 Add `setDriveActive(on)` with the random `setTimeout` flicker (short 15–70 / 10–60 ms, occasional 120–260 / 90–200 ms) toggling `.on` on `#drive-led`; verify from the DevTools console that it flickers irregularly when active and is off when inactive
- [x] 4.2 Start the hold in `print()` when a line enters an empty queue (`holdUntil` = now + random 250–450 ms) and make `typeFrame` wait until it passes; call `setDriveActive` when the queue starts and empties, and from `flush()` and `cancel()`; verify that `ls` shows `> ls` immediately, then about 0.25–0.45 s of flicker with no output, then typed output, and the light goes off at the end
- [x] 4.3 Verify skip and clear: pressing a letter during the pause of `help` writes the whole help text at once, turns the light off, and puts the letter in the prompt; `clear` during output leaves only the welcome screen, which starts with its own pause
- [x] 4.4 Verify reduced motion (stub `matchMedia` in DevTools): output is instant, there is no pause, and the light never lights up

## 5. Small screens and reference

- [x] 5.1 Add the below-600 px rules (thinner case and bezel, smaller corners, logo hidden, drive about 150 px wide); verify at 375 px width that there is no sideways scrolling and the drive, its light and the scrollbar are visible
- [x] 5.2 Add `design/lunchmatch-frame.png` (the approved mockup) to the repo, and verify it's staged with the change

## 6. End-to-end check

- [x] 6.1 Reload: the welcome screen appears after a short flicker; run `login anna`, `new 13:00 pizza "Luigi's"`, `ls`, `help` (skip with a key during the pause), page through it with Page Up / Page Down and check the hint at its end, then `clear` (scrollbar gone); verify each step against the monitor-frame spec and the existing terminal-console spec, and that there are no console errors
