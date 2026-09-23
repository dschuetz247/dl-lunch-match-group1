# terminal-console Specification

## Purpose
A keyboard-driven, terminal-style user interface with the look of an old green monochrome monitor, through which developers use LunchMatch by typing commands.

## Requirements

### Requirement: Terminal look
The interface SHALL look like an old green-phosphor monochrome monitor: bright green monospace text on a black background, with a single hue in different brightness levels (e.g. dimmer for hints, brighter for highlights). It MUST show a header line with the app name, today's date and the logged-in user (or that nobody is logged in), and a prompt with a blinking block cursor. Any scanline or glow effects MUST NOT make text hard to read.

#### Scenario: App opens
- **WHEN** a user opens the page
- **THEN** they see green text on black, a header with `LUNCHMATCH`, today's date and the login state, a short welcome line pointing to `help`, and a focused command prompt

### Requirement: Command input
The user SHALL enter commands by typing into a single prompt line and pressing Enter. The prompt MUST be focused on load and after each command, and clicking anywhere on the page MUST move focus back to it. Each command entered MUST be echoed into the output above the prompt, followed by its result. Pressing the up/down arrow keys MUST move through previously entered commands of this session. Commands and flags MUST be case-insensitive.

#### Scenario: Run a command
- **WHEN** the user types `help` and presses Enter
- **THEN** `> help` and the help text appear in the output and the prompt is empty and focused again

#### Scenario: Command history
- **WHEN** the user has entered `ls` and then `whoami`, and presses the up arrow twice
- **THEN** the prompt contains `ls`

#### Scenario: Empty input
- **WHEN** the user presses Enter on an empty prompt
- **THEN** nothing but a new empty prompt line is shown

### Requirement: Command set
The console SHALL support these commands:
- `help`: lists all commands with a one-line description and an example each.
- `login <name>`: sets the current user. Names are single words, compared case-insensitively and displayed in lower case. Logging in as a different name switches the user.
- `logout`: clears the current user.
- `whoami`: shows the current user and the group they are in, if any.
- `ls [--food <food>] [--with <name>] [--from HH:MM] [--to HH:MM]`: lists today's groups as an aligned table with columns ID, TIME, FOOD, PLACE, WHO, where TIME shows the 45-minute slot as a range (e.g. `12:00-12:45`).
- `new <HH:MM> <food> <place>`: creates a group; a place with spaces MUST be given in double quotes.
- `join <id>`: joins a group.
- `leave [<id>]`: leaves the given group, or the user's current group when no ID is given.
- `clear`: clears the output, including any output still waiting to be typed, and then shows the welcome screen.

There MUST NOT be a command to switch the typewriter effect; `typing` is an unknown command.

#### Scenario: Log in
- **WHEN** the user runs `login Anna`
- **THEN** the output confirms the login as `anna` and the header shows `anna`

#### Scenario: Switch user in the same tab
- **WHEN** `anna` is logged in and the user runs `login ben`
- **THEN** the current user is `ben` and further commands act as `ben`

#### Scenario: Create a group with a quoted place
- **WHEN** the logged-in user runs `new 12:30 burger "Five Guys"`
- **THEN** a group at `12:30` with food `burger` and place `Five Guys` is created and its ID is shown

#### Scenario: List as a table
- **WHEN** the user runs `ls` and groups exist
- **THEN** the groups are shown in aligned columns under an `ID TIME FOOD PLACE WHO` header, with each TIME shown as a slot range such as `12:00-12:45` and members separated by commas

#### Scenario: Leave the current group without an ID
- **WHEN** `anna` is in group 3 and runs `leave`
- **THEN** `anna` leaves group 3

#### Scenario: Clear
- **WHEN** `anna` is logged in and runs `clear`
- **THEN** all earlier output is removed and only the welcome screen is shown, ending with `Hello anna. N groups today.`, and the prompt remains

#### Scenario: Clear cancels pending output
- **WHEN** output is still being typed and the user runs `clear`
- **THEN** only the welcome screen is shown, and none of the earlier pending output appears afterwards

#### Scenario: Toggle typing
- **WHEN** the user runs `typing`
- **THEN** the output shows `command not found: typing` and a hint to type `help`

#### Scenario: Invalid typing argument
- **WHEN** the user runs `typing fast`
- **THEN** the output shows `command not found: typing`, not a usage line

### Requirement: Errors and usage messages
Unknown commands and wrong arguments SHALL produce a short, readable error line instead of failing silently. Errors about wrong arguments MUST include the command's usage line.

#### Scenario: Unknown command
- **WHEN** the user runs `lunch now`
- **THEN** the output shows `command not found: lunch` and a hint to type `help`

#### Scenario: Missing arguments
- **WHEN** the user runs `new 12:00`
- **THEN** the output shows an error and the usage `new <HH:MM> <food> <place>`

#### Scenario: Command requires login
- **WHEN** nobody is logged in and the user runs `join 1`
- **THEN** the output tells them to run `login <name>` first

### Requirement: Typewriter output
App output SHALL be typed into the output area character by character, one line after another, at about 4 ms per character, instead of appearing all at once. This covers command results, errors, usage lines, help, and the welcome screen. The echo of the user's own command (`> ...`), the prompt, and the header MUST update instantly. Output MUST keep its original line order; output from a later command MUST start only after all earlier output has been written. While typing, the view MUST stay scrolled to the bottom. Users MUST NOT be able to switch the effect off; the only exception is a system that requests reduced motion, where all output MUST appear instantly.

#### Scenario: Output is typed
- **WHEN** the user runs `help`
- **THEN** `> help` appears immediately, and the help lines then appear character by character, in order, until the full help text is shown

#### Scenario: Typing speed
- **WHEN** the user runs `help` (about 750 characters) without pressing a key
- **THEN** the full help text takes about 3 seconds to appear (about 4 ms per character)

#### Scenario: Keypress finishes output
- **WHEN** output is still being typed and the user presses any key
- **THEN** all pending output is written out completely at once, and the key still takes effect in the prompt (e.g. a letter appears in the input)

#### Scenario: Typing continues during output
- **WHEN** output is still being typed and the user types `ls` and presses Enter
- **THEN** the earlier output is complete and shown above `> ls`, followed by the output of `ls`

#### Scenario: Reduced motion
- **WHEN** the system requests reduced motion
- **THEN** all output appears instantly

#### Scenario: Typing off
- **WHEN** the user runs `typing off`
- **THEN** the output shows `command not found: typing`, and later output is still typed

#### Scenario: Earlier saved choice is ignored
- **WHEN** the browser still holds a saved `typing off` choice from an earlier version
- **THEN** output is still typed

### Requirement: Welcome screen
The console SHALL show a welcome screen when the app opens and again after `clear`. The first line MUST be the banner `LUNCHMATCH/OS <version> - type 'help'`. The second line MUST be `Hello <name>. N groups today.` when a user is logged in, or `run 'login <name>' to start. N groups today.` when nobody is logged in, where `N` is the number of today's groups whose slot has not ended yet (`1 group` in the singular). The welcome screen is app output and is typed like other output.

#### Scenario: Open while logged in
- **WHEN** `anna` is logged in, one group exists today, and the app is opened
- **THEN** the output shows the banner line and `Hello anna. 1 group today.`

#### Scenario: Open while logged out
- **WHEN** nobody is logged in, no groups exist today, and the app is opened
- **THEN** the output shows the banner line and `run 'login <name>' to start. 0 groups today.`
