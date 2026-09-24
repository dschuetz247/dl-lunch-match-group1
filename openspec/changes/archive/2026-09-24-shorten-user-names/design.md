# Design

## Context

In `app.js`, `normalizeName()` only trims and lower-cases. `store.setUser()` saves the normalized name under `lunchmatch.user`, `login` prints `logged in as <name>`, and `listGroups` normalizes `--with` the same way. Requirements are in `specs/terminal-console/spec.md`.

## Goals / Non-Goals

**Goals:**
- One `resolveName(input, claim)` function used by `login` (with `claim = true`) and `--with` (with `claim = false`).

**Non-Goals:**
- Renaming names already stored in today's groups; they keep their form until the day resets.
- A command to list or reset the name map.

## Decisions

### A persistent name map
The map lives under `lunchmatch.names` in localStorage, as a plain object `{ "<full name>": "<short name>" }`. It isn't cleared on a new day, because "same full name → same short name" must hold across days. Only names longer than 20 characters are stored; short names never need an entry.

### `resolveName(input, claim)`
1. `name = normalizeName(input)`. If `name.length <= 20`, return it unchanged (no suffix). An exact 20-character name is its own base, so it matches the first owner automatically.
2. If the map has `name`, return the stored short name.
3. `base = name.slice(0, 20)`, and `taken` = the set of short names in the map. Pick `base` if it isn't taken, otherwise the first of `base01`…`base99` that isn't taken. If none is free, throw `too many users named <base>…`.
4. With `claim = true`, store `map[name] = short`. With `claim = false` (`--with`), store nothing, and if the name isn't in the map, return `base` so the filter matches its first owner.

`store.setUser` receives the already-resolved name. `login` prints ` (name shortened)` when the result differs from the lower-cased input.
*Alternative:* store only short names and reject collisions. Rejected: the user explicitly wants long names to keep working with numbered suffixes.

## Risks / Trade-offs

- [The map only exists in one browser, so the same long name can get different suffixes in different browsers] → Accepted; groups aren't shared across browsers either.
- [Someone can log in with another person's long name and get their short name] → Accepted, as there's no authentication by design.
