# Proposal

## Why

User names can currently be any length, so a long name can overflow the header and the `ls` table. Limiting names to 22 characters lets the 80-column screen (planned in `add-monitor-frame`) always show them in full, while people with long names can keep typing their full name to log in.

## What Changes

- At `login`, a name longer than 20 characters is cut to its first 20 characters. Names of 20 characters or fewer are unchanged.
- If that shortened name already belongs to a different person (someone who logged in earlier with a different full name that shortens to the same 20 characters), the lowest free two-digit number `01`, `02`, `03`, … is appended, e.g. `alexandra-montgomery01`. So names are at most 22 characters.
- The browser remembers which full name got which short name, so the same full name always gets the same short name again, also on later days. A name typed as exactly the 20-character short name counts as its first owner.
- `login` says when a name was shortened, e.g. `logged in as alexandra-montgomery01 (name shortened)`.
- `ls --with <name>` accepts the full or the short name and finds the right person.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `terminal-console`: `login` shortens long names as described, and `ls --with` resolves names the same way (adds a "User name shortening" requirement and updates "Command set").

## Impact

- `app.js`: name resolution at login and in the `--with` filter, a persistent name map in localStorage (`lunchmatch.names`), and the login message.
- Groups and data from earlier days are unaffected. A long name that is already stored in today's groups keeps its old form until the next day.
