# Tasks

## 1. Typing engine

- [x] 1.1 Split `print()` in `app.js` into `printNow()` (current instant behavior) and a queue-based `print()` that creates an empty line element and enqueues `{ el, text }`; verify that existing commands still show their full output
- [x] 1.2 Add the `requestAnimationFrame` typing loop (time-based, ~2 ms per character, line by line, scrolling to the bottom each frame) plus `flush()` and `cancel()`; verify that `help` visibly types out in order in about 1–2 s
- [x] 1.3 Use `printNow()` for the command echo in `submit()`; verify that `> help` appears instantly while the help text is still typing

## 2. Interaction

- [x] 2.1 Add a capture-phase `keydown` listener on `document` that calls `flush()` when the queue isn't empty, without preventing the default; verify that pressing a letter during `help` completes the output immediately and the letter appears in the prompt
- [x] 2.2 Verify queueing: run `help`, type `ls` + Enter while it types; `> ls` must appear below the complete help text, followed by the `ls` table
- [x] 2.3 Make `clear` call `cancel()` before emptying the output; verify that running `clear` while `help` is typing leaves an empty screen and no leftover lines appear

## 3. Setting

- [x] 3.1 Add the effective-state logic (saved `lunchmatch.typing`, otherwise not `prefers-reduced-motion`) and bypass the queue when typing is off; verify with DevTools rendering emulation of reduced motion that output is instant without a saved setting
- [x] 3.2 Add the `typing [on|off]` command (status without an argument, `(default)` when nothing is saved, usage error for other arguments) and add it to `help`; verify that `typing off` makes output instant and survives a reload, `typing` reports `typing: off`, and `typing fast` prints the usage

## 4. End-to-end check

- [x] 4.1 Reload with typing on: the welcome lines type out; run `login anna`, `new 12:00 pizza "Luigi's"`, `ls`, `help` (skip with a key), `clear`, `typing off`, `ls`; verify each step against the terminal-console spec and that there are no console errors
