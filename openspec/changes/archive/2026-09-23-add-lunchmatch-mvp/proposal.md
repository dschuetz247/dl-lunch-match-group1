# Proposal

## Why

The 50-70 people in our department often want to have lunch with colleagues, but they don't know who is free when or what the others feel like eating. LunchMatch is a minimal tool (an MVP) for starting and finding lunch groups for today. It is built for a software-developer audience and has to be built in about 50 minutes of dev time.

## What Changes

- Add a single-page web app (plain HTML/CSS/JS, no build step, no backend) that looks and works like a terminal on an old green monochrome monitor.
- Users identify themselves by name (`login <name>`); switching users in the same tab is how a single-browser demo plays several people.
- Users can list today's lunch groups and filter them by time, food category, or person.
- Users can create a group (start time in 15-minute steps, food category, place), join a group, and leave it.
- A group is deleted automatically when its last member leaves; groups apply to the current day only; there is no group size limit.
- Data is stored in the browser's `localStorage`, and groups from previous days are ignored/purged.

## Capabilities

### New Capabilities
- `lunch-groups`: the lunch-group domain for the current day: creating, joining, leaving, listing and filtering groups; deleting a group once it is empty; day scoping; storing data in the browser.
- `terminal-console`: the terminal-style user interface: command prompt and parser, the `login` identity, command output formatting, help and error messages, and the green-phosphor monochrome look.

### Modified Capabilities
<!-- none: no existing specs -->

## Impact

- New files in the repo root (e.g. `index.html`, `style.css`, `app.js`); no dependencies, server, or build tooling.
- Data lives only in one browser; several devices do not share groups (out of scope for the MVP).
- Out of scope: authentication, a place/restaurant database, preference matching, notifications, planning future days, multi-device sync.
