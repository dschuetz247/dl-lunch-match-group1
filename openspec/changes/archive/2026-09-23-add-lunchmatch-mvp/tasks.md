# Tasks

## 1. Skeleton and look

- [x] 1.1 Create `index.html` (header line, scrollable output div, prompt line with `>` and an input), `style.css` and `app.js`, linked with a plain `<script>` tag; verify that opening `index.html` by double-click shows the page with no console errors
- [x] 1.2 Add the green-phosphor theme (CSS color variables, VT323 font with `monospace` fallback, black background, borderless input, blinking block cursor); verify the page shows green monospace text on black and the cursor blinks

## 2. Group store (localStorage)

- [x] 2.1 Implement load/save of `{ day, nextId, groups }` under the `lunchmatch` key, resetting when `day` isn't today; verify in DevTools that changing `day` to yesterday and reloading empties the groups
- [x] 2.2 Implement start-time validation (`HH:MM`, minutes 00/15/30/45) and `createGroup(user, time, food, place)`, with the creator as first member and a new ID; verify from the DevTools console that `12:10` and `25:00` are rejected and `12:15` is created
- [x] 2.3 Implement `joinGroup` and `leaveGroup`, including the one-group-per-user move, deleting a group when its last member leaves, and the errors for not found / already a member / not a member; verify from the console that joining a second group removes the user from the first, and that the last member leaving deletes the group
- [x] 2.4 Implement `listGroups(filters)`: sorted by time, filtering by food (case-insensitive), member, and from/to time, with filters combinable; verify from the console against the lunch-groups filter scenarios

## 3. Console

- [x] 3.1 Implement the input handling: Enter runs the command, the command is echoed into the output, results are appended with `textContent`, output auto-scrolls, a click anywhere focuses the input, and empty input does nothing; verify by typing an unknown word and seeing `command not found: <word>` plus a `help` hint
- [x] 3.2 Implement a tokenizer that keeps double-quoted strings together and parses `--flag value` options, plus a command table with usage/description; verify that `new 12:30 burger "Five Guys"` parses to place `Five Guys`
- [x] 3.3 Implement `help`, `login <name>`, `logout`, `whoami` and `clear`, with the header showing today's date and the current user and the login saved in `lunchmatch.user`; verify that `login Anna` shows `anna` in the header and survives a reload
- [x] 3.4 Implement `new`, `join`, `leave [<id>]` on top of the store, with the login check and usage errors on missing arguments; verify `new 12:00` prints the usage, and that `join 1` when logged out asks you to log in
- [x] 3.5 Implement `ls` with `--food`, `--with`, `--from`, `--to` as an aligned `ID TIME FOOD PLACE WHO` table, with a "no groups found" message; verify that the columns line up with 3 groups and that the filters narrow the list

## 4. Polish (drop if time runs out)

- [x] 4.1 Add arrow up/down command history; verify that after `ls` and `whoami`, pressing up twice puts `ls` in the prompt
- [x] 4.2 Add a subtle glow (text-shadow) and a scanline overlay that doesn't intercept clicks; verify text stays readable and clicking still focuses the input
- [x] 4.3 Show a welcome line (`LUNCHMATCH/OS v0.1 - type 'help'`) on load; verify it appears when the page opens

## 5. End-to-end check

- [x] 5.1 Demo run in one tab: `login anna` -> `new 12:00 pizza "Luigi's"` -> `login ben` -> `ls --food pizza` -> `join 1` -> `ls --with ben` -> `login anna` -> `leave` -> `login ben` -> `leave` -> `ls`; verify every step matches the specs and group 1 is gone at the end
