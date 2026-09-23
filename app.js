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

  // Loads today's data; anything from an earlier day is discarded and removed from storage.
  function load() {
    var data = null;
    try { data = JSON.parse(storageGet(DATA_KEY)); } catch (e) { data = null; }
    if (!data || data.day !== today() || !Array.isArray(data.groups)) {
      data = freshData();
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

  // Removes user from group, deleting the group when it becomes empty. Returns whether it was deleted.
  function removeMember(data, group, user) {
    group.members = group.members.filter(function (m) { return m !== user; });
    if (group.members.length === 0) {
      data.groups = data.groups.filter(function (g) { return g.id !== group.id; });
      return true;
    }
    return false;
  }

  // One group per user: leaves the current group (if any) before creating or joining another.
  function leaveCurrent(data, user) {
    var current = groupOf(data, user);
    if (!current) return null;
    return { group: current, deleted: removeMember(data, current, user) };
  }

  function requireUser(user) {
    if (!user) throw new Error("not logged in. run: login <name>");
    return normalizeName(user);
  }

  var store = {
    today: today,
    validateTime: validateTime,

    createGroup: function (user, time, food, place) {
      user = requireUser(user);
      validateTime(time);
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
      var deleted = removeMember(data, group, user);
      save(data);
      return { group: group, deleted: deleted };
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
      var member = filters["with"] != null ? normalizeName(filters["with"]) : null;

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

  var headerEl = document.getElementById("header");
  var terminalEl = document.getElementById("terminal");
  var outputEl = document.getElementById("output");
  var inputEl = document.getElementById("cmd");
  var mirrorEl = document.getElementById("mirror");

  var history = [];
  var historyIndex = 0;

  function print(text, cls) {
    var line = document.createElement("div");
    line.className = "line" + (cls ? " " + cls : "");
    line.textContent = text;
    outputEl.appendChild(line);
  }

  function renderHeader() {
    var user = store.getUser();
    var date = DAYS[new Date().getDay()] + " " + today();
    headerEl.textContent = "LUNCHMATCH/OS " + VERSION + "  |  " + date + "  |  user: " + (user || "(not logged in)");
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

  function describe(group) {
    return "#" + group.id + " (" + group.time + " " + group.food + " @ " + group.place + ")";
  }

  function people(n) {
    return n + (n === 1 ? " person" : " people");
  }

  function printLeft(left) {
    if (!left) return;
    print("left " + describe(left.group) + (left.deleted ? " -- group empty -> deleted" : ""), "dim");
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
      }
    },

    login: {
      usage: "login <name>",
      description: "log in (or switch user)",
      example: "login anna",
      run: function (args) {
        if (args.length !== 1) throw new UsageError(args.length ? "name must be a single word" : "missing name");
        store.setUser(args[0]);
        renderHeader();
        print("logged in as " + store.getUser(), "bright");
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
          return [String(g.id), g.time, g.food, g.place, g.members.join(", ")];
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
      }
    },

    clear: {
      usage: "clear",
      description: "clear the screen",
      example: "clear",
      run: function () {
        outputEl.textContent = "";
      }
    }
  };

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
      print("> " + line, "echo");
      history.push(line);
      execute(line);
    } else {
      print(">", "echo");
    }
    historyIndex = history.length;
    renderMirror();
    terminalEl.scrollTop = terminalEl.scrollHeight;
  }

  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
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
  print("LUNCHMATCH/OS " + VERSION + " - type 'help'", "bright");
  var user = store.getUser();
  var count = store.listGroups().length;
  print((user ? "welcome back, " + user + ". " : "run 'login <name>' to start. ") +
    count + (count === 1 ? " group" : " groups") + " today.", "dim");
  renderMirror();
  inputEl.focus();
})();
