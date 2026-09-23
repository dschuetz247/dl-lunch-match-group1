# Proposal

## Why

Right now LunchMatch output appears all at once, which breaks the old-terminal illusion. Typing lines out character by character, like a slow serial terminal, makes the monochrome look feel real. It has to stay fast and skippable, though, so developers never wait on the UI.

## What Changes

- App output (command results, errors, help, the welcome lines) is typed out character by character at about 2 ms per character, one line after another.
- Any keypress immediately finishes all output still being typed; the key still goes to the prompt, so typing is never blocked.
- Output of further commands queues behind output still being typed, and line order is always preserved.
- Only app output is animated: the echo of the user's own command, the prompt, and the header update instantly.
- The view keeps scrolling to the bottom while text is being typed.
- `clear` cancels any pending output and empties the screen.
- Users whose system requests reduced motion (`prefers-reduced-motion`) get instant output by default.
- New command `typing [on|off]` turns the effect on or off (saved in the browser); without an argument it shows the current state.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `terminal-console`: adds a typewriter-output requirement, adds the `typing` command to the command set, and makes `clear` cancel pending output.

## Impact

- `app.js`: `print()` becomes queue-based with a typing loop; key handling and `clear` interact with the queue; new `typing` command.
- `style.css`: possibly a cursor on the line being typed.
- No change to `lunch-groups`, the data format, or dependencies.
