# monitor-frame Specification

## Purpose
Frames the LunchMatch terminal in the case of an old compact all-in-one computer, with an 80-column screen, a vintage scrollbar with Page Up/Down paging, and a 5¼″ floppy drive whose activity light and short load pause make the app feel like it reads data from disk before answering.

## Requirements

### Requirement: Computer case around the screen
The app SHALL be shown inside the frame of an old compact all-in-one computer, as in the reference mockup `design/lunchmatch-frame.png`. The frame MUST consist of:
- A case in `#d6c79f` with a `#b09f72` edge and equally rounded corners (18 px) on all four sides.
- A recessed screen bezel in `#b9aa80`, which holds the existing terminal screen (header, output and prompt).
- A row below the screen with the `LunchMatch` logo on the left, then a green power light and the floppy drive front plate on the right.

The case MUST NOT show wear marks such as stains, scratches, chips or stickers. The page around the case MUST be a plain dark background. Scanline and glow effects MUST apply to the screen only, not to the case. All console behavior (focus, click anywhere to focus, typing, history, scrolling of the output) MUST work unchanged inside the frame, and only the output area inside the screen scrolls.

#### Scenario: App opens in the frame
- **WHEN** a user opens the app on a desktop browser
- **THEN** the terminal screen appears inside the beige case with the recessed bezel, and below it the `LunchMatch` logo, the green power light and the floppy drive

#### Scenario: Console works inside the frame
- **WHEN** the user clicks on the case, then types `ls` and presses Enter
- **THEN** the prompt has focus and the command runs as without the frame

#### Scenario: Long output scrolls inside the screen
- **WHEN** the output is taller than the screen
- **THEN** only the output area scrolls, the vintage scrollbar appears on the right, and the case and the drive stay in place

### Requirement: Screen width
On screens at least 700 px wide, the screen's header and output area SHALL be at least 80 characters wide, so the header line (`LUNCHMATCH/OS <version>  |  <day> <date>  |  user: <name>`) always shows a user name of up to 22 characters in full; lines MUST NOT be cut off or wrapped at 80 characters or fewer. On narrower screens, the 80-character minimum MUST be dropped: the header then shows `user: <name>` on its own line so the name stays complete, and longer output lines wrap instead of causing sideways scrolling.

#### Scenario: Longest name on a desktop
- **WHEN** the window is 1024 px wide and the user `alexandra-montgomery01` (22 characters) is logged in
- **THEN** the header shows the whole name on one line, and an `ls` row with that name in the WHO column is not wrapped

#### Scenario: Phone width header
- **WHEN** the window is 375 px wide and `alexandra-montgomery01` is logged in
- **THEN** the header shows `user: alexandra-montgomery01` in full on its own line, and nothing scrolls sideways

### Requirement: Screen scrollbar and paging
When the output has more lines than fit on the screen, a scrollbar SHALL be shown at the right edge of the screen, in the style of vintage green-phosphor terminals: a narrow, green, outlined box running the height of the output area, with a solid green thumb set slightly inside it (no arrows, no track pattern). The thumb's length MUST show how much of the output is visible, and its position where the view is. When everything fits, the scrollbar MUST NOT be shown. The browser's own scrollbar MUST be hidden. Clicking the box above or below the thumb MUST scroll one page, dragging the thumb MUST scroll freely, and the mouse wheel and touch scrolling MUST keep working; none of this may take focus away from the prompt. Page Up and Page Down MUST scroll the output by one screen height minus one line, without changing the text in the prompt or the command history. When new output arrives, the view MUST jump to the bottom as before. The `help` output MUST end with a hint for these keys, after the command list, in the same layout as the commands: a `keys:` line, then `PgUp / PgDn`, then a dimmed, indented `scroll the output one page up / down`.

#### Scenario: Scrollbar only on overflow
- **WHEN** the screen shows only the welcome screen
- **THEN** no scrollbar is shown

#### Scenario: Scrollbar after long output
- **WHEN** the user runs `help` and the output is taller than the screen
- **THEN** the outlined scrollbar appears with the thumb at the bottom

#### Scenario: Page Up and Page Down
- **WHEN** the output is taller than the screen, the user has typed `jo` in the prompt, and presses Page Up, then Page Down
- **THEN** the output scrolls up by one screen minus one line and back down, the thumb moves accordingly, and the prompt still contains `jo`

#### Scenario: Click on the track
- **WHEN** the output is taller than the screen and the user clicks the scrollbar box above the thumb
- **THEN** the output scrolls up by one page and the prompt keeps focus

#### Scenario: Scrollbar disappears after clear
- **WHEN** the scrollbar is shown and the user runs `clear`
- **THEN** only the welcome screen remains and the scrollbar is no longer shown

#### Scenario: Help shows the paging hint
- **WHEN** the user runs `help`
- **THEN** the output ends with `keys:`, `PgUp / PgDn` and the dimmed line `scroll the output one page up / down`

### Requirement: Floppy drive front plate
The drive SHALL look like the front plate of a closed 5¼″ floppy drive:
- A plate in `#dacca3` with a small square activity light at its top left.
- One recess with rounded corners, centered horizontally on the plate.
- A dark disk slot running horizontally through the recess, with no edge directly below the slot.
- A lever in the closed position: vertical across the slot, its pivot centered horizontally on the recess, and exactly as long as the recess is high.

The plate MUST NOT show a rotation arrow, extra tabs or steps next to the slot, or a highlight line on the lever. The drive is decoration only; clicking it MUST NOT do anything except focus the prompt like any other click.

#### Scenario: Drive shown closed
- **WHEN** the app is open
- **THEN** the drive shows the lever standing vertically across the slot, centered on the recess, and the activity light is off while no output is pending

### Requirement: Drive activity light
The drive's activity light SHALL flicker at random while app output is pending, i.e. during the disk-load pause and while text is being typed, and MUST be off at all other times. The flicker MUST be irregular: mostly short flashes (on for about 15–70 ms, off for about 10–60 ms), with occasional longer ones (on for about 120–260 ms, or off for about 90–200 ms). A new random duration MUST be chosen for every change. The light MUST be green when lit. The echo of the user's own command does not count as output and MUST NOT light it. With reduced motion, the light MUST stay off.

#### Scenario: Flicker during output
- **WHEN** the user runs `help`
- **THEN** the drive light flickers irregularly until the help text is complete, then goes off

#### Scenario: Off after skipping
- **WHEN** output is pending and the user presses any key
- **THEN** all pending output appears at once and the drive light goes off

#### Scenario: Reduced motion
- **WHEN** the system requests reduced motion and the user runs `ls`
- **THEN** the output appears instantly and the drive light stays off

### Requirement: Disk load pause before output
Before each block of output starts, there SHALL be a disk-load pause of a random 250–450 ms, during which the drive light already flickers and nothing of the block is printed yet. A block is all output produced by one command, or the welcome screen (on load and after `clear`). The echo of the user's command MUST still appear immediately, before the pause. The pause counts as pending output: any key press MUST end it and write the whole block at once, and `clear` MUST drop it together with the rest of the pending output. With reduced motion, there MUST be no pause.

#### Scenario: Pause before the result
- **WHEN** the user runs `ls`
- **THEN** `> ls` appears immediately, the drive light starts flickering, nothing else appears for about 250–450 ms, and then the `ls` output types out

#### Scenario: Pause before the welcome screen
- **WHEN** the app opens, or the user runs `clear`
- **THEN** the drive light flickers for about 250–450 ms before the welcome screen starts typing

#### Scenario: Key press skips the pause
- **WHEN** the load pause of `help` is running and the user presses a letter key
- **THEN** the complete help text appears at once, the drive light goes off, and the letter appears in the prompt

### Requirement: Frame on small screens
On screens narrower than 600 px, the frame SHALL get thinner so the terminal stays usable: less padding around the screen, smaller corners, and a smaller drive. The logo MAY be hidden. The drive, its activity light and the screen scrollbar MUST stay visible, and the page MUST NOT scroll sideways.

#### Scenario: Phone width
- **WHEN** the app is opened at a width of 375 px
- **THEN** the frame, the screen and the drive fit the width without sideways scrolling, and the terminal text remains readable
