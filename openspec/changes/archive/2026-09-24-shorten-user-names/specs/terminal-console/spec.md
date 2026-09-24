# Spec Delta

## ADDED Requirements

### Requirement: User name shortening
User names SHALL be at most 22 characters. At `login`, the name is first put in lower case. A name of 20 characters or fewer MUST be used unchanged. A longer name MUST be cut to its first 20 characters. If that shortened name already belongs to a different full name, the lowest free two-digit suffix `01`–`99` MUST be appended. The browser MUST remember which full name got which short name, across days, so the same full name always gets the same short name again. The first full name that shortens to a given 20 characters owns that name without a suffix, and a name typed as exactly those 20 characters counts as that same first owner. If all suffixes `01`–`99` are taken, the login MUST be rejected with an error. When a name was shortened, the login confirmation MUST say so.

#### Scenario: Short name unchanged
- **WHEN** the user runs `login anna`
- **THEN** the user is `anna`

#### Scenario: Long name is shortened
- **WHEN** nobody has used a name starting with `alexandra-montgomery` before and the user runs `login alexandra-montgomery-fitzgerald`
- **THEN** the user is `alexandra-montgomery`, and the output says `logged in as alexandra-montgomery (name shortened)`

#### Scenario: Same shortened name, different person
- **WHEN** `alexandra-montgomery-fitzgerald` has logged in before and the user runs `login alexandra-montgomery-smith`
- **THEN** the user is `alexandra-montgomery01`

#### Scenario: Same person again
- **WHEN** `alexandra-montgomery-fitzgerald` got `alexandra-montgomery` earlier and runs `login alexandra-montgomery-fitzgerald` again, on the same or a later day
- **THEN** the user is again `alexandra-montgomery`, without a suffix

#### Scenario: Exact short name
- **WHEN** `alexandra-montgomery-fitzgerald` got `alexandra-montgomery` earlier and the user runs `login alexandra-montgomery`
- **THEN** the user is `alexandra-montgomery`, the same person

#### Scenario: Next free suffix
- **WHEN** `alexandra-montgomery` and `alexandra-montgomery01` are already taken and a third different long name with the same first 20 characters logs in
- **THEN** that user is `alexandra-montgomery02`

## MODIFIED Requirements

### Requirement: Command set
The console SHALL support these commands:
- `help`: lists all commands with a one-line description and an example each.
- `login <name>`: sets the current user. Names are single words, compared case-insensitively and displayed in lower case, and long names are shortened as described in "User name shortening". Logging in as a different name switches the user.
- `logout`: clears the current user.
- `whoami`: shows the current user and the group they are in, if any.
- `ls [--food <food>] [--with <name>] [--from HH:MM] [--to HH:MM]`: lists today's groups as an aligned table with columns ID, TIME, FOOD, PLACE, WHO, where TIME shows the 45-minute slot as a range (e.g. `12:00-12:45`). `--with` accepts a full or a short name and is resolved like a login, without claiming a new name.
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

#### Scenario: Filter by a full long name
- **WHEN** `alexandra-montgomery-smith` got `alexandra-montgomery01` and is in group 1, and the user runs `ls --with alexandra-montgomery-smith`
- **THEN** group 1 is listed

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
