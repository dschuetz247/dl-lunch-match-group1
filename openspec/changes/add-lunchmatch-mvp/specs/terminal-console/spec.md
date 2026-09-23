# Spec Delta

## Purpose

A keyboard-driven, terminal-style user interface with the look of an old green monochrome monitor, through which developers use LunchMatch by typing commands.

## ADDED Requirements

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
- `ls [--food <food>] [--with <name>] [--from HH:MM] [--to HH:MM]`: lists today's groups as an aligned table with columns ID, TIME, FOOD, PLACE, WHO.
- `new <HH:MM> <food> <place>`: creates a group; a place with spaces MUST be given in double quotes.
- `join <id>`: joins a group.
- `leave [<id>]`: leaves the given group, or the user's current group when no ID is given.
- `clear`: clears the output.

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
- **THEN** the groups are shown in aligned columns under an `ID TIME FOOD PLACE WHO` header, with members separated by commas

#### Scenario: Leave the current group without an ID
- **WHEN** `anna` is in group 3 and runs `leave`
- **THEN** `anna` leaves group 3

#### Scenario: Clear
- **WHEN** the user runs `clear`
- **THEN** the output area is empty and the prompt remains

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
