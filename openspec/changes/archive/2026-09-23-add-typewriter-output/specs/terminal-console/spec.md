# Spec Delta

## ADDED Requirements

### Requirement: Typewriter output
App output SHALL be typed into the output area character by character, one line after another, at about 2 ms per character, instead of appearing all at once. This covers command results, errors, usage lines, help, and the welcome lines on load. The echo of the user's own command (`> ...`), the prompt, and the header MUST update instantly. Output MUST keep its original line order; output from a later command MUST start only after all earlier output has been written. While typing, the view MUST stay scrolled to the bottom.

#### Scenario: Output is typed
- **WHEN** typing is on and the user runs `help`
- **THEN** `> help` appears immediately, and the help lines then appear character by character, in order, until the full help text is shown

#### Scenario: Keypress finishes output
- **WHEN** output is still being typed and the user presses any key
- **THEN** all pending output is written out completely at once, and the key still takes effect in the prompt (e.g. a letter appears in the input)

#### Scenario: Typing continues during output
- **WHEN** output is still being typed and the user types `ls` and presses Enter
- **THEN** the earlier output is complete and shown above `> ls`, followed by the output of `ls`

#### Scenario: Reduced motion
- **WHEN** the system requests reduced motion and the user has not run `typing on`
- **THEN** all output appears instantly

#### Scenario: Typing off
- **WHEN** the user has run `typing off`
- **THEN** all later output appears instantly, including after a page reload

## MODIFIED Requirements

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
- `clear`: clears the output, including any output still waiting to be typed.
- `typing [on|off]`: turns typewriter output on or off and saves the choice in the browser; without an argument it shows the current state. Without a saved choice, typing is on unless the system requests reduced motion.

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

#### Scenario: Clear cancels pending output
- **WHEN** output is still being typed and the user runs `clear`
- **THEN** the output area is empty and none of the earlier pending output appears afterwards

#### Scenario: Toggle typing
- **WHEN** the user runs `typing off`, then `typing`
- **THEN** the output confirms typing is off, and `typing` reports `typing: off`

#### Scenario: Invalid typing argument
- **WHEN** the user runs `typing fast`
- **THEN** the output shows an error and the usage `typing [on|off]`
