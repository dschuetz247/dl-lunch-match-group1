# Spec Delta

## ADDED Requirements

### Requirement: Gap-free group numbering
Today's group IDs SHALL always be the numbers `1..n` without gaps, in the order the groups were created. When a group is deleted, whether its last member leaves, its last member moves to another group, or its lunch slot ends, every group created after it MUST move down by one ID. When the deletion was caused by the user's own command, the user MUST be told that the remaining groups were renumbered; groups removed because their slot ended are renumbered without a message. A newly created group MUST get the ID `n+1`, where `n` is the number of groups before it was created.

#### Scenario: Renumber after deletion
- **WHEN** groups `#1`, `#2` and `#3` exist and the last member of `#2` leaves it
- **THEN** `#2` is deleted, the former `#3` becomes `#2` with its data and members unchanged, `#1` keeps its ID, and the user is told the groups were renumbered

#### Scenario: Deleting the last group
- **WHEN** groups `#1` and `#2` exist and `#2` is deleted
- **THEN** only `#1` remains, no other ID changes, and the user is not told about any renumbering

#### Scenario: Move away deletes and renumbers
- **WHEN** `ben` is the only member of `#1`, groups `#2` and `#3` exist, and `ben` joins `#3`
- **THEN** `#1` is deleted, the former `#2` and `#3` become `#1` and `#2`, and `ben` is a member of the new `#2`

#### Scenario: New group after deletion
- **WHEN** two groups remain after a deletion and a user creates a new group
- **THEN** the new group gets ID `#3`

#### Scenario: Expired group renumbers silently
- **WHEN** group `#1` (12:00) and group `#2` (12:30) exist and it is 12:46
- **THEN** the former `#2` is listed as `#1`, and no renumbering message is shown

### Requirement: 45-minute lunch slots
Each group's lunch slot SHALL last 45 minutes, from its start time to start time + 45 minutes (local time). Once the end of a group's slot is in the past, the group MUST NOT be listed, counted or joinable, and it MUST be deleted from storage, with the remaining groups renumbered. A group whose slot has started but not yet ended MUST still be listed and joinable. A slot that would end after midnight does not end within the current day.

#### Scenario: Expired group is removed
- **WHEN** groups at `12:00` (`#1`) and `12:30` (`#2`) exist and it is 12:46
- **THEN** the `12:00` group is no longer listed or stored, and the `12:30` group is listed as `#1`

#### Scenario: Running group stays visible
- **WHEN** a group at `12:00` exists and it is 12:30
- **THEN** the group is still listed and a user can join it

## MODIFIED Requirements

### Requirement: Create a group
A logged-in user SHALL be able to create a group for today. The creator MUST automatically become its first member. The system MUST assign the group an ID that is unique among today's groups. Creating a group whose 45-minute slot has already ended MUST be rejected.

#### Scenario: Create a group
- **WHEN** logged-in user `anna` creates a group at `12:00`, food `pizza`, place `Luigi's`
- **THEN** a new group exists with that time, food and place, its members are `anna`, and the user sees its ID

#### Scenario: Create without being logged in
- **WHEN** no user is logged in and someone tries to create a group
- **THEN** no group is created and they are told to log in first

#### Scenario: Slot already over
- **WHEN** it is 13:00 and a user creates a group at `09:00`
- **THEN** no group is created and the user is told that this time slot is already over

### Requirement: List and filter groups
The system SHALL list today's groups sorted by start time, showing each group's ID, start and end time, food category, place and members. The list MUST support filtering by food category (case-insensitive exact match), by member name, and by earliest and latest start time. Filters MUST be combinable, and a group is shown only if it matches all given filters.

#### Scenario: List all groups
- **WHEN** a user lists groups and groups exist at `12:30` and `12:00`
- **THEN** both are shown, the `12:00` group first

#### Scenario: Filter by food
- **WHEN** groups with food `pizza` and `asian` exist and the user filters by food `Asian`
- **THEN** only the `asian` group is shown

#### Scenario: Filter by person
- **WHEN** the user filters by member `anna`
- **THEN** only groups that have `anna` as a member are shown

#### Scenario: Filter by time window
- **WHEN** groups exist at `11:30`, `12:00` and `13:00` and the user filters for start times from `12:00` to `12:30`
- **THEN** only the `12:00` group is shown

#### Scenario: No groups match
- **WHEN** no group matches the filters, or there are no groups today
- **THEN** the user is told that no groups were found
