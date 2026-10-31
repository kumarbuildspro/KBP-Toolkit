// =====================================
// KumarBuildsPro - All-in-One Tools
// =====================================

const $ = (id) => document.getElementById(id);

const STORAGE = {
  theme: "kbp_theme",
  notes: "kbp_notes_history",
  draft: "kbp_note_draft",
  todos: "kbp_todo_list"
};

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let notesHistory = readStorage(STORAGE.notes, []);
let todos = readStorage(STORAGE.todos, []);

if (!Array.isArray(notesHistory)) notesHistory = [];
if (!Array.isArray(todos)) todos = [];

// =====================================
// THEME
// =====================================

function applyTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  $("themeBtn").textContent = theme === "light" ? "🌙 Dark" : "☀️ Light";
  writeStorage(STORAGE.theme, theme);
}

applyTheme(readStorage(STORAGE.theme, "dark"));

$("themeBtn").addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("light") ? "dark" : "light";
  applyTheme(nextTheme);
});

// =====================================
// CLOCK AND YEAR
// =====================================

function updateClock() {
  $("clock").textContent = new Date().toLocaleTimeString();
}

updateClock();
setInterval(updateClock, 1000);
$("year").textContent = new Date().getFullYear();

// =====================================
// TOOL NAVIGATION
// =====================================

const toolNames = {
  calculator: "Calculator",
  wordcounter: "Word Counter",
  notes: "My Notes",
  converter: "Unit Converter",
  todo: "To-Do List",
  stopwatch: "Stopwatch",
  colorpicker: "Color Picker",
  random: "Random Number Generator",
  backup: "Backup Center"
};

document.querySelectorAll(".tool-card").forEach((card) => {
  card.addEventListener("click", () => {
    const selectedTool = card.dataset.tool;

    document.querySelectorAll(".tool-card").forEach((item) => {
      item.classList.toggle("active", item === card);
    });

    document.querySelectorAll(".tool-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === selectedTool);
    });

    $("workspaceTitle").textContent = toolNames[selectedTool];

    if (selectedTool === "backup") {
      updateBackupCounts();
    }

    document.querySelector(".workspace").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});

// =====================================
// CALCULATOR
// =====================================

let calcExpression = "";

function updateCalculator() {
  $("calcDisplay").value = calcExpression || "0";
}

document.querySelectorAll(".calc-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.dataset.value;

    if (value === "C") {
      calcExpression = "";
      updateCalculator();
      return;
    }

    if (value === "DEL") {
      calcExpression = calcExpression.slice(0, -1);
      updateCalculator();
      return;
    }

    if (value === "=") {
      try {
        if (!calcExpression) return;

        // Only basic mathematical characters are accepted.
        if (!/^[0-9+\-*/%.() ]+$/.test(calcExpression)) {
          throw new Error("Invalid input");
        }

        const result = Function('"use strict"; return (' + calcExpression + ')')();

        if (!Number.isFinite(result)) {
          throw new Error("Invalid result");
        }

        calcExpression = String(Number(result.toFixed(10)));
        updateCalculator();
      } catch {
        $("calcDisplay").value = "Error";
        calcExpression = "";
      }
      return;
    }

    if (calcExpression.length < 40) {
      calcExpression += value;
    }

    updateCalculator();
  });
});

// =====================================
// WORD COUNTER
// =====================================

function updateWordCounter() {
  const text = $("wordText").value;
  const trimmed = text.trim();

  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const characters = text.length;
  const sentences = trimmed
    ? (trimmed.match(/[.!?]+/g) || []).length
    : 0;

  $("wordCount").textContent = words;
  $("charCount").textContent = characters;
  $("sentenceCount").textContent = sentences;
}

$("wordText").addEventListener("input", updateWordCounter);

$("clearWordText").addEventListener("click", () => {
  $("wordText").value = "";
  updateWordCounter();
});

// =====================================
// NOTES
// =====================================

function saveNotes() {
  writeStorage(STORAGE.notes, notesHistory);
  updateBackupCounts();
}

function renderNotes() {
  const list = $("notesList");
  list.innerHTML = "";

  $("noteCount").textContent = notesHistory.length;

  if (notesHistory.length === 0) {
    list.innerHTML = '<div class="empty-state">No saved notes yet.</div>';
    saveNotes();
    return;
  }

  notesHistory.forEach((note, index) => {
    const item = document.createElement("div");
    item.className = "saved-item";

    const title = document.createElement("h4");
    title.textContent = note.title || "Untitled Note";

    const content = document.createElement("p");
    content.textContent = note.content || "";

    const date = document.createElement("div");
    date.className = "saved-meta";
    date.textContent = note.date || "";

    const actions = document.createElement("div");
    actions.className = "saved-actions";

    const openBtn = document.createElement("button");
    openBtn.className = "small-btn";
    openBtn.textContent = "Open";
    openBtn.addEventListener("click", () => {
      $("noteTitle").value = note.title || "";
      $("noteContent").value = note.content || "";
      writeStorage(STORAGE.draft, {
        title: note.title || "",
        content: note.content || ""
      });
      $("noteTitle").focus();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "small-btn delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      if (!confirm("Delete this note?")) return;

      notesHistory.splice(index, 1);
      saveNotes();
      renderNotes();
    });

    actions.append(openBtn, deleteBtn);
    item.append(title, content, date, actions);
    list.appendChild(item);
  });

  updateBackupCounts();
}

$("saveNote").addEventListener("click", () => {
  const title = $("noteTitle").value.trim();
  const content = $("noteContent").value.trim();

  if (!title && !content) {
    alert("Please write a note first.");
    return;
  }

  notesHistory.unshift({
    id: Date.now(),
    title: title || "Untitled Note",
    content,
    date: new Date().toLocaleString()
  });

  saveNotes();
  renderNotes();

  $("noteTitle").value = "";
  $("noteContent").value = "";

  writeStorage(STORAGE.draft, { title: "", content: "" });

  alert("Your note has been saved!");
});

$("clearNote").addEventListener("click", () => {
  $("noteTitle").value = "";
  $("noteContent").value = "";
  writeStorage(STORAGE.draft, { title: "", content: "" });
});

const savedDraft = readStorage(STORAGE.draft, null);

if (savedDraft && typeof savedDraft === "object") {
  $("noteTitle").value = savedDraft.title || "";
  $("noteContent").value = savedDraft.content || "";
}

$("noteTitle").addEventListener("input", saveDraft);
$("noteContent").addEventListener("input", saveDraft);

function saveDraft() {
  writeStorage(STORAGE.draft, {
    title: $("noteTitle").value,
    content: $("noteContent").value
  });
}

renderNotes();

// =====================================
// UNIT CONVERTER
// =====================================

const conversionUnits = {
  length: {
    Meter: 1,
    Kilometer: 1000,
    Centimeter: 0.01,
    Millimeter: 0.001,
    Mile: 1609.344,
    Foot: 0.3048,
    Inch: 0.0254
  },

  weight: {
    Kilogram: 1,
    Gram: 0.001,
    Milligram: 0.000001,
    Pound: 0.45359237,
    Ounce: 0.0283495
  },

  temperature: {
    Celsius: 1,
    Fahrenheit: 1,
    Kelvin: 1
  }
};

function fillUnitOptions() {
  const type = $("convertType").value;
  const units = Object.keys(conversionUnits[type]);

  $("convertFrom").innerHTML = "";
  $("convertTo").innerHTML = "";

  units.forEach((unit) => {
    const option1 = document.createElement("option");
    option1.value = unit;
    option1.textContent = unit;

    const option2 = document.createElement("option");
    option2.value = unit;
    option2.textContent = unit;

    $("convertFrom").appendChild(option1);
    $("convertTo").appendChild(option2);
  });

  if (units.length > 1) {
    $("convertTo").selectedIndex = 1;
  }
}

$("convertType").addEventListener("change", fillUnitOptions);

function convertTemperature(value, from, to) {
  let celsius;

  if (from === "Celsius") {
    celsius = value;
  } else if (from === "Fahrenheit") {
    celsius = (value - 32) * 5 / 9;
  } else {
    celsius = value - 273.15;
  }

  if (to === "Celsius") return celsius;
  if (to === "Fahrenheit") return (celsius * 9 / 5) + 32;
  return celsius + 273.15;
}

$("convertBtn").addEventListener("click", () => {
  const value = Number($("convertValue").value);
  const type = $("convertType").value;
  const from = $("convertFrom").value;
  const to = $("convertTo").value;

  if ($("convertValue").value.trim() === "" || !Number.isFinite(value)) {
    $("convertResult").textContent = "Please enter a valid number.";
    return;
  }

  let result;

  if (type === "temperature") {
    result = convertTemperature(value, from, to);
  } else {
    const baseValue = value * conversionUnits[type][from];
    result = baseValue / conversionUnits[type][to];
  }

  $("convertResult").textContent =
    `${value} ${from} = ${Number(result.toFixed(6))} ${to}`;
});

fillUnitOptions();

// =====================================
// TO-DO LIST
// =====================================

function saveTodos() {
  writeStorage(STORAGE.todos, todos);
  updateBackupCounts();
}

function renderTodos() {
  const list = $("todoList");
  list.innerHTML = "";

  const completed = todos.filter((task) => task.done).length;

  $("todoTotal").textContent = todos.length;
  $("todoDone").textContent = completed;

  if (todos.length === 0) {
    list.innerHTML = '<div class="empty-state">No tasks added yet.</div>';
    updateBackupCounts();
    return;
  }

  todos.forEach((task, index) => {
    const item = document.createElement("div");
    item.className = "todo-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(task.done);
    checkbox.setAttribute("aria-label", "Mark task completed");

    checkbox.addEventListener("change", () => {
      todos[index].done = checkbox.checked;
      saveTodos();
      renderTodos();
    });

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = task.text || "";
    text.classList.toggle("completed", Boolean(task.done));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "small-btn delete-btn";
    deleteBtn.textContent = "Delete";

    deleteBtn.addEventListener("click", () => {
      todos.splice(index, 1);
      saveTodos();
      renderTodos();
    });

    item.append(checkbox, text, deleteBtn);
    list.appendChild(item);
  });

  updateBackupCounts();
}

function addTodo() {
  const text = $("todoInput").value.trim();

  if (!text) {
    alert("Please enter a task.");
    return;
  }

  todos.push({
    text,
    done: false,
    date: new Date().toLocaleString()
  });

  $("todoInput").value = "";
  saveTodos();
  renderTodos();
}

$("addTodo").addEventListener("click", addTodo);

$("todoInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") addTodo();
});

renderTodos();

// =====================================
// STOPWATCH
// =====================================

let stopwatchSeconds = 0;
let stopwatchInterval = null;

function formatStopwatch(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((number) => String(number).padStart(2, "0"))
    .join(":");
}

function updateStopwatch() {
  $("stopwatchDisplay").textContent = formatStopwatch(stopwatchSeconds);
}

$("startWatch").addEventListener("click", () => {
  if (stopwatchInterval !== null) return;

  stopwatchInterval = setInterval(() => {
    stopwatchSeconds++;
    updateStopwatch();
  }, 1000);
});

$("pauseWatch").addEventListener("click", () => {
  clearInterval(stopwatchInterval);
  stopwatchInterval = null;
});

$("resetWatch").addEventListener("click", () => {
  clearInterval(stopwatchInterval);
  stopwatchInterval = null;
  stopwatchSeconds = 0;
  updateStopwatch();
});

updateStopwatch();

// =====================================
// COLOR PICKER
// =====================================

function updateColor() {
  const color = $("colorInput").value.toUpperCase();

  $("colorCode").textContent = color;
  $("colorPreview").style.background = color;
}

$("colorInput").addEventListener("input", updateColor);
updateColor();

$("copyColor").addEventListener("click", async () => {
  const color = $("colorInput").value.toUpperCase();

  try {
    await navigator.clipboard.writeText(color);
    $("colorStatus").textContent = "Color code copied!";
  } catch {
    $("colorStatus").textContent = "Copy not supported here. Select the code to copy.";
  }
});

// =====================================
// RANDOM NUMBER GENERATOR
// =====================================

$("generateRandom").addEventListener("click", () => {
  const minText = $("randomMin").value.trim();
  const maxText = $("randomMax").value.trim();

  const min = Number(minText);
  const max = Number(maxText);

  if (
    minText === "" ||
    maxText === "" ||
    !Number.isSafeInteger(min) ||
    !Number.isSafeInteger(max)
  ) {
    $("randomStatus").textContent = "Enter valid whole numbers.";
    return;
  }

  if (min > max) {
    $("randomStatus").textContent = "Minimum cannot be greater than maximum.";
    return;
  }

  if (!Number.isSafeInteger(max - min)) {
    $("randomStatus").textContent = "The selected range is too large.";
    return;
  }

  const number = Math.floor(Math.random() * (max - min + 1)) + min;

  $("randomResult").textContent = number;
  $("randomStatus").textContent = "Your random number is ready.";
});

// =====================================
// BACKUP CENTER
// =====================================

function updateBackupCounts() {
  $("backupNoteCount").textContent = notesHistory.length;
  $("backupTodoCount").textContent = todos.length;
}

function createBackupData() {
  return {
    app: "KumarBuildsPro",
    backupVersion: 1,
    createdAt: new Date().toISOString(),
    data: {
      notes: notesHistory,
      noteDraft: readStorage(STORAGE.draft, {
        title: "",
        content: ""
      }),
      todos: todos,
      theme: readStorage(STORAGE.theme, "dark")
    }
  };
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getDateForFilename() {
  return new Date().toISOString().slice(0, 10);
}

// Download complete JSON backup
$("downloadBackup").addEventListener("click", () => {
  const backup = createBackupData();

  downloadFile(
    `KumarBuildsPro-Backup-${getDateForFilename()}.json`,
    JSON.stringify(backup, null, 2),
    "application/json;charset=utf-8"
  );

  $("backupStatus").textContent = "Complete backup download started.";
});

// Download Notes TXT
$("downloadNotesTxt").addEventListener("click", () => {
  if (notesHistory.length === 0) {
    $("backupStatus").textContent = "There are no saved notes to download.";
    return;
  }

  const text = notesHistory.map((note, index) => {
    return [
      `NOTE ${index + 1}`,
      `Title: ${note.title || "Untitled Note"}`,
      `Date: ${note.date || "Not available"}`,
      "",
      note.content || "",
      "",
      "----------------------------------------",
      ""
    ].join("\n");
  }).join("\n");

  downloadFile(
    `KumarBuildsPro-Notes-${getDateForFilename()}.txt`,
    text,
    "text/plain;charset=utf-8"
  );

  $("backupStatus").textContent = "Notes download started.";
});

// Download To-Do TXT
$("downloadTodosTxt").addEventListener("click", () => {
  if (todos.length === 0) {
    $("backupStatus").textContent = "There are no tasks to download.";
    return;
  }

  const text = todos.map((task, index) => {
    const status = task.done ? "Completed" : "Pending";

    return `${index + 1}. [${status}] ${task.text}`;
  }).join("\n");

  downloadFile(
    `KumarBuildsPro-Tasks-${getDateForFilename()}.txt`,
    text,
    "text/plain;charset=utf-8"
  );

  $("backupStatus").textContent = "Tasks download started.";
});

// Restore JSON backup
$("restoreBackup").addEventListener("click", async () => {
  const file = $("backupFile").files[0];

  if (!file) {
    $("backupStatus").textContent = "Please choose a JSON backup file first.";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    $("backupStatus").textContent = "File is too large. Maximum size is 5 MB.";
    return;
  }

  try {
    const fileText = await file.text();
    const backup = JSON.parse(fileText);

    // Check backup format before changing current data.
    if (
      backup.app !== "KumarBuildsPro" ||
      backup.backupVersion !== 1 ||
      !backup.data ||
      !Array.isArray(backup.data.notes) ||
      !Array.isArray(backup.data.todos)
    ) {
      throw new Error("This is not a valid KumarBuildsPro backup file.");
    }

    const validNotes = backup.data.notes.every((note) =>
      note &&
      typeof note === "object" &&
      typeof note.title === "string" &&
      typeof note.content === "string"
    );

    const validTodos = backup.data.todos.every((task) =>
      task &&
      typeof task === "object" &&
      typeof task.text === "string" &&
      typeof task.done === "boolean"
    );

    if (!validNotes || !validTodos) {
      throw new Error("Backup data format is not valid.");
    }

    const importedTheme =
      backup.data.theme === "light" ? "light" : "dark";

    const draft = backup.data.noteDraft &&
      typeof backup.data.noteDraft === "object"
      ? {
          title: String(backup.data.noteDraft.title || ""),
          content: String(backup.data.noteDraft.content || "")
        }
      : { title: "", content: "" };

    const confirmed = confirm(
      "Restore this backup?\n\nYour current Notes and Tasks will be replaced by the backup data."
    );

    if (!confirmed) {
      $("backupStatus").textContent = "Restore cancelled. Your current data is unchanged.";
      return;
    }

    notesHistory = backup.data.notes;
    todos = backup.data.todos;

    writeStorage(STORAGE.notes, notesHistory);
    writeStorage(STORAGE.todos, todos);
    writeStorage(STORAGE.draft, draft);

    applyTheme(importedTheme);

    $("noteTitle").value = draft.title;
    $("noteContent").value = draft.content;

    renderNotes();
    renderTodos();
    updateBackupCounts();

    $("backupFile").value = "";
    $("backupStatus").textContent =
      "Backup restored successfully! Your saved data has been updated.";

  } catch (error) {
    $("backupStatus").textContent =
      error.message || "Could not read this backup file.";
  }
});

updateBackupCounts();
