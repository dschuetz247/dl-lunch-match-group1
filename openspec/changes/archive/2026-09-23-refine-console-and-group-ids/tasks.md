# Tasks

## 1. Gap-free group IDs

- [x] 1.1 In `app.js`, make `removeMember()` renumber `data.groups` to `1..n` by array position and reset `nextId` when a group is deleted, returning whether later groups were renumbered; verify from the DevTools console that with groups #1–#3, emptying #2 turns the old #3 into #2 with the same members, and a new group then gets #3
- [x] 1.2 Pass the renumbered flag through `leaveGroup` and `leaveCurrent`, and print a dim `groups renumbered` line in `leave`, `join` and `new` when it is set; verify that `leave` on the middle of three groups prints it, and that deleting the last group doesn't

## 2. 45-minute slots

- [x] 2.1 Add a `nowMinutes()` helper and make `load()` drop groups whose `start + 45 min <= now`, renumbering with the same helper as 1.1 and saving, without a message; verify from the DevTools console with a stubbed `Date` that at 12:30 a 12:00 group is still listed and joinable, and at 12:46 it is gone and the 12:30 group has become #1
- [x] 2.2 Make `createGroup` reject a slot that is already over (`that time slot is already over`); verify with a stubbed clock at 13:00 that `new 09:00 x y` is rejected and `new 12:30 x y` is accepted
- [x] 2.3 Show the slot as `HH:MM-HH:MM` in the `ls` TIME column and in group descriptions; verify `ls` shows `12:00-12:45` with aligned columns, and a `23:30` group shows `23:30-00:15` and is not expired during the day

## 3. Typewriter

- [x] 3.1 Change `CHAR_MS` from 2 to 4; verify `help` (about 750 characters) takes about 3 seconds
- [x] 3.2 Remove `TYPING_KEY`, `typingSaved()` and the `typing` command, and reduce `typingEnabled()` to the reduced-motion check; verify `typing off` answers `command not found: typing`, `help` no longer lists it, a leftover `lunchmatch.typing = "off"` in localStorage has no effect, and simulated reduced motion still gives instant output

## 4. Welcome screen

- [x] 4.1 Extract `printWelcome()` (banner + `Hello <name>. N groups today.` or `run 'login <name>' to start. N groups today.`, singular `1 group`, counting only groups that haven't ended) and call it on load; verify both variants after a reload
- [x] 4.2 Make `clear` call `printWelcome()` after cancelling and emptying the output; verify that `clear` while logged in as `anna` shows only the welcome screen ending in `Hello anna. N groups today.`, and that `clear` during `help` leaves no leftover help lines

## 5. End-to-end check

- [x] 5.1 With the clock stubbed to 11:00, run: `login anna` -> `new 12:00 pizza "Luigi's"` -> `login ben` -> `new 12:30 burger "Five Guys"` -> `login chris` -> `new 13:00 asian "Pho House"` -> `login ben` -> `leave` (#2 deleted, groups renumbered) -> `ls` (IDs #1, #2 with slot ranges) -> `clear` (welcome with `Hello ben. 2 groups today.`). Then move the clock to 12:46 and run `ls`: only the 13:00 group remains, as #1, with no renumbering message. Verify each step against the specs, and that there are no console errors
