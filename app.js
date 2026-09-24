/* LunchMatch: a terminal-style lunch group finder. Plain script, no modules (works on file://). */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Store: today's lunch groups, persisted in localStorage              */
  /* ------------------------------------------------------------------ */

  var DATA_KEY = "lunchmatch";
  var USER_KEY = "lunchmatch.user";
  var TIME_FORMAT = /^([01]\d|2[0-3]):[0-5]\d$/;

  // In-memory fallback for browsers where localStorage is blocked (private mode, file:// policies)
  var memory = {};
  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return key in memory ? memory[key] : null; }
  }
  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { memory[key] = value; }
  }
  function storageRemove(key) {
    try { window.localStorage.removeItem(key); } catch (e) { delete memory[key]; }
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function freshData() {
    return { day: today(), nextId: 1, groups: [] };
  }

  /* Lunch slots: a group runs from its start time to start + SLOT_MINUTES */

  var SLOT_MINUTES = 45;

  function toMinutes(time) {
    return Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  }
  function nowMinutes() {
    var d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
  // Slots ending after midnight (e.g. 23:30 -> 24:15 minutes) never count as over within the day
  function isOver(time) {
    return toMinutes(time) + SLOT_MINUTES <= nowMinutes();
  }
  function slotEnd(time) {
    var end = toMinutes(time) + SLOT_MINUTES;
    return pad2(Math.floor(end / 60) % 24) + ":" + pad2(end % 60);
  }

  // Gap-free IDs: groups are kept in creation order, so an ID is just the position + 1
  function renumber(data) {
    data.groups.forEach(function (g, i) { g.id = i + 1; });
    data.nextId = data.groups.length + 1;
  }

  // Loads today's data; anything from an earlier day is discarded and removed from storage,
  // and groups whose slot has ended are dropped silently (renumbering the rest).
  function load() {
    var data = null;
    try { data = JSON.parse(storageGet(DATA_KEY)); } catch (e) { data = null; }
    if (!data || data.day !== today() || !Array.isArray(data.groups)) {
      data = freshData();
      save(data);
    }
    var running = data.groups.filter(function (g) { return !isOver(g.time); });
    if (running.length !== data.groups.length) {
      data.groups = running;
      renumber(data);
      save(data);
    }
    return data;
  }
  function save(data) {
    storageSet(DATA_KEY, JSON.stringify(data));
  }

  function normalizeName(name) {
    return String(name).trim().toLowerCase();
  }

  /* User names: long names are cut to NAME_BASE characters, plus a 01-99 suffix on collisions */

  var NAMES_KEY = "lunchmatch.names";   // { "<full name>": "<short name>" }, kept across days
  var NAME_BASE = 20;

  function loadNames() {
    try { return JSON.parse(storageGet(NAMES_KEY)) || {}; } catch (e) { return {}; }
  }

  // Resolves a typed name to its (at most 22-character) user name. With claim, a new
  // long name takes the lowest free short name and is remembered for next time.
  function resolveName(input, claim) {
    var name = normalizeName(input);
    if (name.length <= NAME_BASE) return name;
    var names = loadNames();
    if (names[name]) return names[name];
    var base = name.slice(0, NAME_BASE);
    if (!claim) return base;

    var taken = {};
    Object.keys(names).forEach(function (full) { taken[names[full]] = true; });
    var short = base;
    for (var n = 1; taken[short]; n++) {
      if (n > 99) throw new Error("too many users named " + base + "...");
      short = base + pad2(n);
    }
    names[name] = short;
    storageSet(NAMES_KEY, JSON.stringify(names));
    return short;
  }

  function validateTime(time) {
    if (!TIME_FORMAT.test(time)) {
      throw new Error("invalid time '" + time + "': expected HH:MM (24h), e.g. 12:15");
    }
    if (Number(time.slice(3)) % 15 !== 0) {
      throw new Error("invalid time '" + time + "': times must be in 15-minute steps (:00, :15, :30, :45)");
    }
  }

  function findGroup(data, id) {
    for (var i = 0; i < data.groups.length; i++) {
      if (data.groups[i].id === id) return data.groups[i];
    }
    return null;
  }

  function groupOf(data, user) {
    for (var i = 0; i < data.groups.length; i++) {
      if (data.groups[i].members.indexOf(user) !== -1) return data.groups[i];
    }
    return null;
  }

  // Removes user from group, deleting the group when it becomes empty and renumbering the rest.
  // The deleted group object keeps its old ID, so messages can still name it.
  function removeMember(data, group, user) {
    group.members = group.members.filter(function (m) { return m !== user; });
    if (group.members.length) return { deleted: false, renumbered: false };
    var index = data.groups.indexOf(group);
    data.groups.splice(index, 1);
    renumber(data);
    return { deleted: true, renumbered: index < data.groups.length };
  }

  // One group per user: leaves the current group (if any) before creating or joining another.
  function leaveCurrent(data, user) {
    var current = groupOf(data, user);
    if (!current) return null;
    var result = removeMember(data, current, user);
    return { group: current, deleted: result.deleted, renumbered: result.renumbered };
  }

  function requireUser(user) {
    if (!user) throw new Error("not logged in. run: login <name>");
    return normalizeName(user);
  }

  var store = {
    today: today,
    validateTime: validateTime,
    slotEnd: slotEnd,

    createGroup: function (user, time, food, place) {
      user = requireUser(user);
      validateTime(time);
      if (isOver(time)) throw new Error("that time slot is already over (" + time + "-" + slotEnd(time) + ")");
      food = String(food || "").trim();
      place = String(place || "").trim();
      if (!food) throw new Error("food must not be empty");
      if (!place) throw new Error("place must not be empty");

      var data = load();
      var left = leaveCurrent(data, user);
      var group = { id: data.nextId++, time: time, food: food, place: place, members: [user] };
      data.groups.push(group);
      save(data);
      return { group: group, left: left };
    },

    joinGroup: function (user, id) {
      user = requireUser(user);
      var data = load();
      var group = findGroup(data, id);
      if (!group) throw new Error("group #" + id + " not found");
      if (group.members.indexOf(user) !== -1) throw new Error("you are already in group #" + id);

      var left = leaveCurrent(data, user);
      group.members.push(user);
      save(data);
      return { group: group, left: left };
    },

    // id is optional: without it, the user's current group is left.
    leaveGroup: function (user, id) {
      user = requireUser(user);
      var data = load();
      var group;
      if (id == null) {
        group = groupOf(data, user);
        if (!group) throw new Error("you are not in any group");
      } else {
        group = findGroup(data, id);
        if (!group) throw new Error("group #" + id + " not found");
        if (group.members.indexOf(user) === -1) throw new Error("you are not in group #" + id);
      }
      var result = removeMember(data, group, user);
      save(data);
      return { group: group, deleted: result.deleted, renumbered: result.renumbered };
    },

    // filters: { food, with, from, to } - all optional, combined with AND
    listGroups: function (filters) {
      filters = filters || {};
      ["from", "to"].forEach(function (key) {
        if (filters[key] != null && !TIME_FORMAT.test(filters[key])) {
          throw new Error("invalid --" + key + " '" + filters[key] + "': expected HH:MM");
        }
      });
      var food = filters.food != null ? String(filters.food).toLowerCase() : null;
      var member = filters["with"] != null ? resolveName(filters["with"], false) : null;

      return load().groups
        .filter(function (g) {
          return (food === null || g.food.toLowerCase() === food) &&
            (member === null || g.members.indexOf(member) !== -1) &&
            (filters.from == null || g.time >= filters.from) &&
            (filters.to == null || g.time <= filters.to);
        })
        .sort(function (a, b) { return a.time < b.time ? -1 : a.time > b.time ? 1 : a.id - b.id; });
    },

    groupOf: function (user) {
      return user ? groupOf(load(), normalizeName(user)) : null;
    },

    resolveName: resolveName,
    getUser: function () { return storageGet(USER_KEY); },
    setUser: function (name) {
      if (name) storageSet(USER_KEY, normalizeName(name));
      else storageRemove(USER_KEY);
    }
  };

  // Exposed for poking at from the DevTools console
  window.LunchMatch = { store: store };

  /* ------------------------------------------------------------------ */
  /* Console: prompt, parsing, commands, rendering                       */
  /* ------------------------------------------------------------------ */

  var VERSION = "v0.1";
  var DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  var headerSysEl = document.getElementById("header-sys");
  var headerUserEl = document.getElementById("header-user");
  var terminalEl = document.getElementById("terminal");
  var outputEl = document.getElementById("output");
  var inputEl = document.getElementById("cmd");
  var mirrorEl = document.getElementById("mirror");

  var history = [];
  var historyIndex = 0;

  /* Typewriter output: print() queues lines, a rAF loop types them at ~CHAR_MS per character */

  var CHAR_MS = 4;
  var LOAD_MIN_MS = 250;   // "disk load" pause before each block of output
  var LOAD_MAX_MS = 450;
  var queue = [];        // lines waiting to be typed: { el, text }; el joins the DOM when its typing starts
  var typedChars = 0;    // characters of queue[0] already written
  var lastFrame = 0;
  var holdUntil = 0;     // nothing is typed before this time (the disk-load pause)
  var frameRequested = false;

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  /* Floppy drive activity light: flickers at random while output is pending */

  var driveLedEl = document.getElementById("drive-led");
  var driveTimer = null;
  var driveActive = false;

  // Mostly short flashes, now and then a longer one, like a drive reading several sectors
  function driveStep() {
    var lit = driveLedEl.classList.toggle("on");
    var delay = lit
      ? (Math.random() < 0.2 ? random(120, 260) : random(15, 70))
      : (Math.random() < 0.15 ? random(90, 200) : random(10, 60));
    driveTimer = setTimeout(driveStep, delay);
  }

  function setDriveActive(active) {
    if (active === driveActive) return;
    driveActive = active;
    if (active) {
      driveStep();
    } else {
      clearTimeout(driveTimer);
      driveTimer = null;
      driveLedEl.classList.remove("on");
    }
  }

  // Not user-switchable: only a system request for reduced motion turns typing off
  function typingEnabled() {
    return !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function createLine(cls) {
    var line = document.createElement("div");
    line.className = "line" + (cls ? " " + cls : "");
    return line;
  }

  function scrollToBottom() {
    terminalEl.scrollTop = terminalEl.scrollHeight;
    renderScrollbar();
  }

  /* Vintage scrollbar: #terminal scrolls natively (its own bar hidden), #scrollbar mirrors it */

  var scrollbarEl = document.getElementById("scrollbar");
  var thumbEl = document.getElementById("thumb");
  var THUMB_INSET = 2;
  var THUMB_MIN = 16;

  function thumbGeometry() {
    var track = scrollbarEl.clientHeight - 2 * THUMB_INSET;
    var height = Math.max(THUMB_MIN, track * terminalEl.clientHeight / terminalEl.scrollHeight);
    return { track: track, height: height, travel: Math.max(0, track - height) };
  }

  function renderScrollbar() {
    var range = terminalEl.scrollHeight - terminalEl.clientHeight;
    var overflowing = range > 1;
    scrollbarEl.classList.toggle("visible", overflowing);
    if (!overflowing) return;
    var g = thumbGeometry();
    thumbEl.style.height = g.height + "px";
    thumbEl.style.top = (THUMB_INSET + g.travel * terminalEl.scrollTop / range) + "px";
  }

  function lineHeight() {
    return parseFloat(getComputedStyle(terminalEl).lineHeight) || 20;
  }

  // One page = the visible height minus one line, so a line of context stays in view
  function scrollPage(direction) {
    terminalEl.scrollTop += direction * (terminalEl.clientHeight - lineHeight());
  }

  terminalEl.addEventListener("scroll", renderScrollbar);
  window.addEventListener("resize", renderScrollbar);

  // mousedown is prevented so the prompt keeps focus
  scrollbarEl.addEventListener("mousedown", function (e) {
    e.preventDefault();
    if (e.target === thumbEl) {
      var startY = e.clientY;
      var startTop = terminalEl.scrollTop;
      var g = thumbGeometry();
      var ratio = (terminalEl.scrollHeight - terminalEl.clientHeight) / Math.max(1, g.travel);
      var onMove = function (ev) { terminalEl.scrollTop = startTop + (ev.clientY - startY) * ratio; };
      var onUp = function () {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    } else {
      scrollPage(e.clientY < thumbEl.getBoundingClientRect().top ? -1 : 1);
    }
  });

  // Instant output, used for the user's own echo and with reduced motion
  function printNow(text, cls) {
    var line = createLine(cls);
    line.textContent = text;
    outputEl.appendChild(line);
  }

  function print(text, cls) {
    if (!typingEnabled()) { printNow(text, cls); return; }
    if (!queue.length) {
      // First line of a new block: "load it from disk" before typing starts
      holdUntil = performance.now() + random(LOAD_MIN_MS, LOAD_MAX_MS);
      setDriveActive(true);
    }
    queue.push({ el: createLine(cls), text: String(text) });
    if (!frameRequested) {
      frameRequested = true;
      lastFrame = performance.now();
      requestAnimationFrame(typeFrame);
    }
  }

  function typeFrame(now) {
    frameRequested = false;
    if (queue.length && now < holdUntil) {
      // Still "loading": type nothing yet, and start counting characters only after the pause
      lastFrame = now;
      frameRequested = true;
      requestAnimationFrame(typeFrame);
      return;
    }
    var budget = Math.floor((now - lastFrame) / CHAR_MS);
    lastFrame += budget * CHAR_MS;
    while (queue.length) {
      var head = queue[0];
      if (!head.el.parentNode) outputEl.appendChild(head.el);
      var take = Math.min(budget, head.text.length - typedChars);
      typedChars += take;
      budget -= take;
      head.el.textContent = head.text.slice(0, typedChars);
      if (typedChars < head.text.length) break;
      queue.shift();
      typedChars = 0;
    }
    scrollToBottom();
    if (queue.length) {
      frameRequested = true;
      requestAnimationFrame(typeFrame);
    } else {
      setDriveActive(false);
    }
  }

  // Writes all pending output at once
  function flush() {
    queue.forEach(function (item) {
      if (!item.el.parentNode) outputEl.appendChild(item.el);
      item.el.textContent = item.text;
    });
    cancel();
    scrollToBottom();
  }

  // Drops pending output without writing it
  function cancel() {
    queue = [];
    typedChars = 0;
    holdUntil = 0;
    setDriveActive(false);
    renderScrollbar();
  }

  function renderHeader() {
    var user = store.getUser();
    var date = DAYS[new Date().getDay()] + " " + today();
    // Split so the user can move to its own line on narrow screens (see style.css)
    headerSysEl.textContent = "LUNCHMATCH/OS " + VERSION + "  |  " + date;
    headerUserEl.textContent = "user: " + (user || "(not logged in)");
  }

  // Keeps the visible text + block cursor in sync with the (invisible) real input
  function renderMirror() {
    var value = inputEl.value;
    var pos = inputEl.selectionStart == null ? value.length : inputEl.selectionStart;
    mirrorEl.textContent = "";
    mirrorEl.appendChild(document.createTextNode(value.slice(0, pos)));
    var cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.textContent = value.charAt(pos) || " ";
    mirrorEl.appendChild(cursor);
    mirrorEl.appendChild(document.createTextNode(value.slice(pos + 1)));
  }

  function slot(group) {
    return group.time + "-" + store.slotEnd(group.time);
  }

  function describe(group) {
    return "#" + group.id + " (" + slot(group) + " " + group.food + " @ " + group.place + ")";
  }

  function printRenumbered(result) {
    if (result && result.renumbered) print("groups renumbered", "dim");
  }

  function people(n) {
    return n + (n === 1 ? " person" : " people");
  }

  function printLeft(left) {
    if (!left) return;
    print("left " + describe(left.group) + (left.deleted ? " -- group empty -> deleted" : ""), "dim");
    printRenumbered(left);
  }

  function parseId(raw) {
    if (!/^#?\d+$/.test(raw)) throw new UsageError("invalid group id '" + raw + "'");
    return Number(raw.replace("#", ""));
  }

  function UsageError(message) { this.message = message; }

  // Splits a line into tokens, keeping "double quoted strings" together.
  function tokenize(line) {
    var tokens = [];
    var re = /"([^"]*)"|(\S+)/g;
    var m;
    while ((m = re.exec(line)) !== null) {
      tokens.push(m[1] !== undefined ? m[1] : m[2]);
    }
    return tokens;
  }

  // Separates positional arguments from --flag value pairs.
  function parseArgs(tokens, allowedFlags) {
    var args = [];
    var opts = {};
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.slice(0, 2) === "--") {
        var name = t.slice(2).toLowerCase();
        if (allowedFlags.indexOf(name) === -1) throw new UsageError("unknown option '--" + name + "'");
        var value = tokens[i + 1];
        if (value === undefined || value.slice(0, 2) === "--") throw new UsageError("missing value for '--" + name + "'");
        opts[name] = value;
        i++;
      } else {
        args.push(t);
      }
    }
    return { args: args, opts: opts };
  }

  function loggedInUser() {
    var user = store.getUser();
    if (!user) throw new Error("not logged in. run: login <name>");
    return user;
  }

  function pad(text, width) {
    text = String(text);
    while (text.length < width) text += " ";
    return text;
  }

  var commands = {
    help: {
      usage: "help",
      description: "show this help",
      example: "help",
      run: function () {
        print("commands:", "bright");
        Object.keys(commands).forEach(function (name) {
          var c = commands[name];
          print("  " + c.usage);
          print("      " + c.description + "  --  e.g. " + c.example, "dim");
        });
        print("keys:", "bright");
        print("  PgUp / PgDn");
        print("      scroll the output one page up / down", "dim");
      }
    },

    login: {
      usage: "login <name>",
      description: "log in (or switch user)",
      example: "login anna",
      run: function (args) {
        if (args.length !== 1) throw new UsageError(args.length ? "name must be a single word" : "missing name");
        var name = store.resolveName(args[0], true);
        store.setUser(name);
        renderHeader();
        print("logged in as " + name + (name !== args[0].toLowerCase() ? " (name shortened)" : ""), "bright");
      }
    },

    logout: {
      usage: "logout",
      description: "log out",
      example: "logout",
      run: function () {
        if (!store.getUser()) { print("not logged in"); return; }
        store.setUser(null);
        renderHeader();
        print("logged out");
      }
    },

    whoami: {
      usage: "whoami",
      description: "show the current user and their group",
      example: "whoami",
      run: function () {
        var user = store.getUser();
        if (!user) { print("not logged in. run: login <name>"); return; }
        var group = store.groupOf(user);
        print(user + (group ? " -- in group " + describe(group) : " -- not in a group"));
      }
    },

    ls: {
      usage: "ls [--food <food>] [--with <name>] [--from HH:MM] [--to HH:MM]",
      description: "list today's groups",
      example: "ls --food pizza --from 12:00",
      flags: ["food", "with", "from", "to"],
      run: function (args, opts) {
        if (args.length) throw new UsageError("unexpected argument '" + args[0] + "'");
        var groups = store.listGroups(opts);
        if (!groups.length) { print("no groups found"); return; }

        var rows = [["ID", "TIME", "FOOD", "PLACE", "WHO"]].concat(groups.map(function (g) {
          return [String(g.id), slot(g), g.food, g.place, g.members.join(", ")];
        }));
        var widths = [0, 0, 0, 0];
        rows.forEach(function (r) {
          for (var i = 0; i < widths.length; i++) widths[i] = Math.max(widths[i], r[i].length);
        });
        rows.forEach(function (r, idx) {
          var line = "  " + widths.map(function (w, i) { return pad(r[i], w); }).join("  ") + "  " + r[4];
          print(line, idx === 0 ? "bright" : null);
        });
      }
    },

    "new": {
      usage: "new <HH:MM> <food> <place>",
      description: "create a group and join it (quote places with spaces)",
      example: "new 12:30 burger \"Five Guys\"",
      run: function (args) {
        var user = loggedInUser();
        if (args.length < 3) throw new UsageError("missing arguments");
        if (args.length > 3) throw new UsageError("too many arguments -- put places with spaces in \"double quotes\"");
        var result = store.createGroup(user, args[0], args[1], args[2]);
        printLeft(result.left);
        print("created " + describe(result.group), "bright");
      }
    },

    join: {
      usage: "join <id>",
      description: "join a group",
      example: "join 2",
      run: function (args) {
        var user = loggedInUser();
        if (args.length !== 1) throw new UsageError(args.length ? "too many arguments" : "missing group id");
        var result = store.joinGroup(user, parseId(args[0]));
        printLeft(result.left);
        print("joined " + describe(result.group) + " -- " + people(result.group.members.length), "bright");
      }
    },

    leave: {
      usage: "leave [<id>]",
      description: "leave a group (default: your current one)",
      example: "leave",
      run: function (args) {
        var user = loggedInUser();
        if (args.length > 1) throw new UsageError("too many arguments");
        var result = store.leaveGroup(user, args.length ? parseId(args[0]) : null);
        print("left " + describe(result.group) + (result.deleted ? " -- group empty -> deleted" : ""));
        printRenumbered(result);
      }
    },

    clear: {
      usage: "clear",
      description: "clear the screen",
      example: "clear",
      run: function () {
        cancel();
        outputEl.textContent = "";
        printWelcome();
      }
    }
  };

  function printWelcome() {
    var user = store.getUser();
    var count = store.listGroups().length;
    print("LUNCHMATCH/OS " + VERSION + " - type 'help'", "bright");
    print((user ? "Hello " + user + ". " : "run 'login <name>' to start. ") +
      count + (count === 1 ? " group" : " groups") + " today.", "dim");
  }

  function execute(line) {
    var tokens = tokenize(line);
    if (!tokens.length) return;
    var name = tokens[0].toLowerCase();
    var command = Object.prototype.hasOwnProperty.call(commands, name) ? commands[name] : null;
    if (!command) {
      print("command not found: " + tokens[0], "err");
      print("type 'help' to see available commands", "dim");
      return;
    }
    try {
      var parsed = parseArgs(tokens.slice(1), command.flags || []);
      command.run(parsed.args, parsed.opts);
    } catch (e) {
      print("error: " + e.message, "err");
      if (e instanceof UsageError) print("usage: " + command.usage, "dim");
    }
    renderHeader();
  }

  function submit() {
    var line = inputEl.value;
    inputEl.value = "";
    if (line.trim()) {
      printNow("> " + line, "echo");
      history.push(line);
      execute(line);
    } else {
      printNow(">", "echo");
    }
    historyIndex = history.length;
    renderMirror();
    scrollToBottom();
  }

  // Any key finishes pending output; capture phase so it runs before Enter submits, and the key still reaches the input
  document.addEventListener("keydown", function () {
    if (queue.length) flush();
  }, true);
  // Paste and on-screen keyboards change the input without a keydown
  inputEl.addEventListener("input", function () {
    if (queue.length) flush();
  });

  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "PageUp" || e.key === "PageDown") {
      // Scrolls the output only; the prompt's text and cursor stay as they are
      e.preventDefault();
      scrollPage(e.key === "PageUp" ? -1 : 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      if (!history.length) return;
      historyIndex += e.key === "ArrowUp" ? -1 : 1;
      historyIndex = Math.max(0, Math.min(history.length, historyIndex));
      inputEl.value = historyIndex < history.length ? history[historyIndex] : "";
      inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
      renderMirror();
    }
  });
  ["input", "keyup", "click", "select", "focus", "blur"].forEach(function (evt) {
    inputEl.addEventListener(evt, renderMirror);
  });
  // A selection-safe "click anywhere to focus"
  document.addEventListener("mouseup", function () {
    var selection = window.getSelection ? window.getSelection().toString() : "";
    if (!selection) inputEl.focus();
  });

  renderHeader();
  printWelcome();
  renderMirror();
  inputEl.focus();
})();
