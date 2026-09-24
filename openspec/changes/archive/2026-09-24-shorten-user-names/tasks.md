# Tasks

## 1. Name resolution

- [x] 1.1 Add the `lunchmatch.names` map helpers and `resolveName(input, claim)` in `app.js` (unchanged up to 20 characters, map lookup, cut to 20, lowest free `01`–`99` suffix, error when all are taken, store only with `claim`); verify from the DevTools console: `alexandra-montgomery-fitzgerald` → `alexandra-montgomery`, then `alexandra-montgomery-smith` → `alexandra-montgomery01`, a third → `…02`, the first again → `alexandra-montgomery`, and `alexandra-montgomery` → itself
- [x] 1.2 Use it in `login` (resolved name saved as the user, ` (name shortened)` in the confirmation) and in the `--with` filter (without claiming); verify `login alexandra-montgomery-smith` shows `logged in as alexandra-montgomery01 (name shortened)` in the output and the header, and that `ls --with alexandra-montgomery-smith` finds that user's group
- [x] 1.3 Verify persistence: after a reload, and with the stored `day` changed to yesterday, `login alexandra-montgomery-smith` still gives `alexandra-montgomery01`; `login anna` is unchanged, with no `(name shortened)`

## 2. End-to-end check

- [x] 2.1 Run `login alexandra-montgomery-fitzgerald`, `new 12:30 x y`, `login alexandra-montgomery-smith`, `join 1`, `ls`, `ls --with alexandra-montgomery-smith`, `whoami`; verify against the terminal-console spec, that no name longer than 22 characters appears anywhere, and that there are no console errors
