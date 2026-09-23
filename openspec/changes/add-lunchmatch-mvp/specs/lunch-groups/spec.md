# Spec Delta

## Purpose

Lets colleagues start, find, join and leave lunch groups for the current day, so they can see who is eating when, where, and what.

## ADDED Requirements

### Requirement: Group attributes
A lunch group SHALL have a numeric ID, a start time, a food category, a place, and a list of members. The start time MUST be a time of day in the 24-hour `HH:MM` format whose minutes are 00, 15, 30 or 45. The food category and place MUST be non-empty text.

#### Scenario: Valid start time
- **WHEN** a user creates a group with start time `12:15`
- **THEN** the group is created with start time `12:15`

#### Scenario: Start time not on a 15-minute step
- **WHEN** a user creates a group with start time `12:10`
- **THEN** no group is created and the user is told that times must be in 15-minute steps

#### Scenario: Malformed start time
- **WHEN** a user creates a group with start time `noon` or `25:00`
- **THEN** no group is created and the user is told the expected `HH:MM` format

### Requirement: Create a group
A logged-in user SHALL be able to create a group for today. The creator MUST automatically become its first member. The system MUST assign the group an ID that is unique among today's groups.

#### Scenario: Create a group
- **WHEN** logged-in user `anna` creates a group at `12:00`, food `pizza`, place `Luigi's`
- **THEN** a new group exists with that time, food and place, its members are `anna`, and the user sees its ID

#### Scenario: Create without being logged in
- **WHEN** no user is logged in and someone tries to create a group
- **THEN** no group is created and they are told to log in first

### Requirement: One group per user per day
A user SHALL be a member of at most one group at a time. When a user who already belongs to a group creates or joins another group, the system MUST first remove them from their current group, applying the empty-group rule.

#### Scenario: Join a second group
- **WHEN** `ben` is a member of group 1 and joins group 2
- **THEN** `ben` is a member of group 2 and no longer of group 1

#### Scenario: Moving away empties the old group
- **WHEN** `ben` is the only member of group 1 and creates a new group
- **THEN** group 1 is deleted and `ben` is the only member of the new group

### Requirement: Join a group
A logged-in user SHALL be able to join any of today's groups by its ID. Groups MUST NOT have a maximum size.

#### Scenario: Join an existing group
- **WHEN** logged-in user `chris` joins group 2, which has members `anna`
- **THEN** group 2's members are `anna, chris`

#### Scenario: Join an unknown group
- **WHEN** a user joins group 99, which does not exist
- **THEN** nothing changes and the user is told that group 99 was not found

#### Scenario: Join a group already joined
- **WHEN** `anna` is a member of group 2 and joins group 2 again
- **THEN** nothing changes and `anna` is told they are already in that group

#### Scenario: No size limit
- **WHEN** a group already has 20 members and another user joins it
- **THEN** the user is added and the group has 21 members

### Requirement: Leave a group
A logged-in user SHALL be able to leave a group they are a member of. When the last member leaves, the system MUST delete the group.

#### Scenario: Leave a group with other members
- **WHEN** `anna` leaves group 2, whose members are `anna, chris`
- **THEN** group 2's members are `chris`

#### Scenario: Last member leaves
- **WHEN** `chris` leaves group 2 and is its only member
- **THEN** group 2 no longer exists and the user is told the group was deleted

#### Scenario: Leave a group the user is not in
- **WHEN** `ben` leaves group 2 and is not a member of it
- **THEN** nothing changes and `ben` is told they are not in that group

### Requirement: List and filter groups
The system SHALL list today's groups sorted by start time, showing each group's ID, start time, food category, place and members. The list MUST support filtering by food category (case-insensitive exact match), by member name, and by earliest and latest start time. Filters MUST be combinable, and a group is shown only if it matches all given filters.

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

### Requirement: Current day only
Groups SHALL apply to the calendar day (local time) on which they were created. Groups from earlier days MUST NOT be shown or joinable and MUST be removed from storage.

#### Scenario: Next day
- **WHEN** groups were created yesterday and a user opens LunchMatch today
- **THEN** no groups from yesterday are listed and yesterday's data is removed

### Requirement: Browser persistence
Groups SHALL be stored in the browser so that they survive a page reload in the same browser on the same day. Groups are NOT shared between different browsers or devices.

#### Scenario: Reload keeps groups
- **WHEN** a group is created and the page is reloaded the same day
- **THEN** the group is still listed with its members
