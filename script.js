/* ============================================================
   LIFE DASHBOARD — script.js
   Vanilla JavaScript — no frameworks, no build tools.
   All data stored in localStorage.
   ============================================================ */

'use strict';

/* ── LOCAL STORAGE KEYS ──────────────────────────────────────── */
const LS_THEME  = 'dashboard_theme';
const LS_NAME   = 'dashboard_name';
const LS_TASKS  = 'dashboard_tasks';
const LS_LINKS  = 'dashboard_links';

/* ── DEFAULT QUICK LINKS ─────────────────────────────────────── */
const DEFAULT_LINKS = [
  { id: 'default-google',  title: 'Google',   url: 'https://www.google.com',   icon: '🔍', isDefault: true },
  { id: 'default-youtube', title: 'YouTube',  url: 'https://www.youtube.com',  icon: '▶️',  isDefault: true },
  { id: 'default-github',  title: 'GitHub',   url: 'https://github.com',       icon: '🐙', isDefault: true },
  { id: 'default-chatgpt', title: 'ChatGPT',  url: 'https://chat.openai.com',  icon: '✨', isDefault: true },
];

/* ── UTILITY HELPERS ─────────────────────────────────────────── */

/**
 * Safe localStorage.getItem with JSON parsing.
 * Returns fallback if key is missing or value is malformed.
 */
function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Safe localStorage.setItem with JSON stringification. */
function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or private mode — fail silently.
  }
}

/** Generate a simple unique id. */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Normalize text for duplicate checking: trim + lowercase. */
function normalize(str) {
  return str.trim().toLowerCase();
}

/**
 * Validate that a URL is safe (http/https only).
 * Returns the URL string if valid, or null.
 */
function validateURL(raw) {
  try {
    const url = new URL(raw.trim());
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
    return null;
  } catch {
    return null;
  }
}

/* ============================================================
   MODULE 1: THEME
   ============================================================ */
const themeToggleBtn = document.getElementById('theme-toggle');

/** Apply a theme to <html> and persist it. */
function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    themeToggleBtn.setAttribute('aria-label', 'Switch to dark theme');
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeToggleBtn.setAttribute('aria-label', 'Switch to light theme');
  }
}

function initTheme() {
  // Read saved preference; default to 'dark'.
  const saved = lsGet(LS_THEME, 'dark');
  applyTheme(saved);
}

themeToggleBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  lsSet(LS_THEME, next);
});

/* ============================================================
   MODULE 2: CLOCK, DATE & GREETING
   ============================================================ */
const clockEl        = document.getElementById('clock');
const dateEl         = document.getElementById('date');
const greetingTextEl = document.getElementById('greeting-text');
const greetingNameEl = document.getElementById('greeting-name');

/**
 * Return a greeting phrase based on current hour.
 * 5–11  → Good Morning
 * 12–17 → Good Afternoon
 * 18–20 → Good Evening
 * else  → Good Night
 */
function getGreeting(hour) {
  if (hour >= 5  && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 18) return 'Good Afternoon';
  if (hour >= 18 && hour <= 20) return 'Good Evening';
  return 'Good Night';
}

/** Update clock display every tick. */
function tickClock() {
  const now  = new Date();
  const h    = String(now.getHours()).padStart(2, '0');
  const m    = String(now.getMinutes()).padStart(2, '0');
  const s    = String(now.getSeconds()).padStart(2, '0');
  clockEl.textContent = `${h}:${m}:${s}`;

  // Update greeting phrase only (name stays separate)
  greetingTextEl.textContent = getGreeting(now.getHours());
}

/** Format the current date as "Friday, October 9, 2026". */
function updateDate() {
  const now = new Date();
  dateEl.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });
}

function initClock() {
  tickClock();
  updateDate();
  // Update clock every second using timestamp-based approach
  setInterval(tickClock, 1000);
  // Update date once per minute (handles midnight rollover)
  setInterval(updateDate, 60_000);
}

/* ============================================================
   MODULE 3: CUSTOM NAME / GREETING
   ============================================================ */
const nameDisplayBtn = document.getElementById('name-display-btn');
const nameEditor     = document.getElementById('name-editor');
const nameInput      = document.getElementById('name-input');
const nameSaveBtn    = document.getElementById('name-save-btn');
const nameCancelBtn  = document.getElementById('name-cancel-btn');

/** Update the visible greeting name span safely. */
function setGreetingName(name) {
  // Use textContent — never innerHTML — for safety.
  greetingNameEl.textContent = name && name.trim() ? name.trim() : 'Friend';
}

/** Open the inline name editor. */
function openNameEditor() {
  const current = lsGet(LS_NAME, '');
  nameInput.value = current;
  nameEditor.hidden = false;
  nameDisplayBtn.setAttribute('aria-expanded', 'true');
  nameInput.focus();
  nameInput.select();
}

/** Close the inline name editor without saving. */
function closeNameEditor() {
  nameEditor.hidden = true;
  nameDisplayBtn.setAttribute('aria-expanded', 'false');
  nameDisplayBtn.focus();
}

/** Save the entered name to localStorage and update greeting. */
function saveName() {
  const val = nameInput.value.trim();
  if (!val) {
    // Empty input — revert to 'Friend', remove from storage.
    lsSet(LS_NAME, '');
    setGreetingName('Friend');
  } else {
    lsSet(LS_NAME, val);
    setGreetingName(val);
  }
  closeNameEditor();
}

function initName() {
  const saved = lsGet(LS_NAME, '');
  setGreetingName(saved || 'Friend');
}

nameDisplayBtn.addEventListener('click', openNameEditor);

nameSaveBtn.addEventListener('click', saveName);

nameCancelBtn.addEventListener('click', closeNameEditor);

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    saveName();
  }
  if (e.key === 'Escape') {
    closeNameEditor();
  }
});

/* ============================================================
   MODULE 4: FOCUS TIMER (Pomodoro — 25 min)
   ============================================================ */
const timerMinEl   = document.getElementById('timer-minutes');
const timerSecEl   = document.getElementById('timer-seconds');
const timerStatus  = document.getElementById('timer-status');
const timerCard    = document.querySelector('.timer-card');
const startBtn     = document.getElementById('timer-start');
const stopBtn      = document.getElementById('timer-stop');
const resetBtn     = document.getElementById('timer-reset');

const TIMER_DURATION_SEC = 25 * 60; // 25 minutes in seconds

const timerState = {
  totalSeconds:   TIMER_DURATION_SEC, // remaining seconds
  running:        false,
  intervalId:     null,
  startTimestamp: null,  // performance.now() when last started
  secondsAtStart: null,  // remaining seconds when last started
};

/** Render current timerState.totalSeconds to the DOM. */
function renderTimer() {
  const m = Math.floor(timerState.totalSeconds / 60);
  const s = timerState.totalSeconds % 60;
  timerMinEl.textContent = String(m).padStart(2, '0');
  timerSecEl.textContent = String(s).padStart(2, '0');
}

/** Update button enabled/disabled states. */
function syncTimerButtons() {
  startBtn.disabled = timerState.running;
  stopBtn.disabled  = !timerState.running;
}

/** Called every ~200 ms; uses timestamps to avoid drift. */
function timerTick() {
  const elapsed = (performance.now() - timerState.startTimestamp) / 1000;
  const remaining = Math.max(0, Math.round(timerState.secondsAtStart - elapsed));
  timerState.totalSeconds = remaining;
  renderTimer();

  if (remaining <= 0) {
    completeTimer();
  }
}

/** Start or resume the timer. */
function startTimer() {
  if (timerState.running) return;
  if (timerState.totalSeconds <= 0) return; // already at zero

  timerState.running        = true;
  timerState.startTimestamp = performance.now();
  timerState.secondsAtStart = timerState.totalSeconds;

  // Use a short tick interval (200 ms) for accuracy.
  // Guard against double-start: clear any stale interval first.
  clearInterval(timerState.intervalId);
  timerState.intervalId = setInterval(timerTick, 200);

  timerStatus.textContent = '';
  timerCard.classList.remove('timer--complete');
  syncTimerButtons();
}

/** Pause the timer. */
function stopTimer() {
  if (!timerState.running) return;

  clearInterval(timerState.intervalId);
  timerState.intervalId = null;

  // Capture remaining time accurately before stopping.
  const elapsed   = (performance.now() - timerState.startTimestamp) / 1000;
  timerState.totalSeconds = Math.max(0, Math.round(timerState.secondsAtStart - elapsed));
  timerState.running = false;

  renderTimer();
  timerStatus.textContent = 'Paused';
  syncTimerButtons();
}

/** Reset the timer to 25:00. */
function resetTimer() {
  clearInterval(timerState.intervalId);
  timerState.intervalId   = null;
  timerState.running      = false;
  timerState.totalSeconds = TIMER_DURATION_SEC;

  renderTimer();
  timerStatus.textContent = '';
  timerCard.classList.remove('timer--complete');
  syncTimerButtons();
}

/** Called when countdown reaches zero. */
function completeTimer() {
  clearInterval(timerState.intervalId);
  timerState.intervalId   = null;
  timerState.running      = false;
  timerState.totalSeconds = 0;

  renderTimer();
  timerStatus.textContent = '✓ Session complete! Take a break.';
  timerCard.classList.add('timer--complete');
  syncTimerButtons();

  // Play a simple beep using Web Audio API if available.
  playCompletionBeep();
}

/** Generate a short beep via Web Audio API (no audio file needed). */
function playCompletionBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.8);
  } catch {
    // Web Audio unavailable or blocked — fail silently.
  }
}

function initTimer() {
  renderTimer();
  syncTimerButtons();
}

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);

/* ============================================================
   MODULE 5: TO-DO LIST
   ============================================================ */
const todoForm     = document.getElementById('todo-form');
const todoInput    = document.getElementById('todo-input');
const todoMsg      = document.getElementById('todo-msg');
const todoListEl   = document.getElementById('todo-list');
const todoEmptyEl  = document.getElementById('todo-empty');
const countDoneEl  = document.getElementById('todo-count-completed');
const countTotalEl = document.getElementById('todo-count-total');

/** In-memory task array. Each task: { id, text, done } */
let tasks = [];

/* ---- Persistence ---- */

function saveTasks() {
  lsSet(LS_TASKS, tasks);
}

function loadTasks() {
  const saved = lsGet(LS_TASKS, []);
  // Validate structure defensively.
  if (!Array.isArray(saved)) return [];
  return saved.filter(
    t => t && typeof t.id === 'string' && typeof t.text === 'string' && typeof t.done === 'boolean'
  );
}

/* ---- Duplicate check ---- */

/**
 * Check if normalized text already exists among tasks.
 * Pass excludeId to skip a specific task (used during edit).
 */
function isDuplicate(text, excludeId = null) {
  const norm = normalize(text);
  return tasks.some(t => t.id !== excludeId && normalize(t.text) === norm);
}

/* ---- Message helpers ---- */

let msgTimeout = null;

function showTodoMsg(text) {
  todoMsg.textContent = text;
  todoMsg.hidden = false;
  clearTimeout(msgTimeout);
  msgTimeout = setTimeout(() => {
    todoMsg.hidden = true;
    todoMsg.textContent = '';
  }, 3500);
}

function hideTodoMsg() {
  clearTimeout(msgTimeout);
  todoMsg.hidden = true;
  todoMsg.textContent = '';
}

/* ---- Render ---- */

/** Update the stats badges. */
function renderStats() {
  const done  = tasks.filter(t => t.done).length;
  const total = tasks.length;
  countDoneEl.textContent  = done;
  countTotalEl.textContent = total;
}

/** Render a single task item into an <li>. */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'todo-item' + (task.done ? ' todo-item--done' : '');
  li.setAttribute('data-id', task.id);

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type    = 'checkbox';
  checkbox.className = 'todo-item__check';
  checkbox.checked  = task.done;
  checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.done ? 'incomplete' : 'complete'}`);
  checkbox.addEventListener('change', () => toggleTask(task.id));

  // Body (text display)
  const body = document.createElement('div');
  body.className = 'todo-item__body';

  const textSpan = document.createElement('span');
  textSpan.className = 'todo-item__text';
  textSpan.textContent = task.text; // Safe — no innerHTML
  body.appendChild(textSpan);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'todo-item__actions';

  // Edit button
  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn--icon edit-btn';
  editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
  editBtn.innerHTML = `<svg aria-hidden="true" focusable="false" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.85 2.85a2 2 0 0 1 2.83 2.83L6.5 16.82l-3.8.95.95-3.8L14.85 2.85z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  editBtn.addEventListener('click', () => startEditTask(task.id, li));

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn--icon delete-btn';
  deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
  deleteBtn.innerHTML = `<svg aria-hidden="true" focusable="false" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="3,5 17,5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M8 5V3h4v2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><rect x="4" y="5" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.6"/><line x1="8" y1="9" x2="8" y2="14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><line x1="12" y1="9" x2="12" y2="14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(checkbox);
  li.appendChild(body);
  li.appendChild(actions);

  return li;
}

/** Full re-render of the task list. */
function renderTasks() {
  todoListEl.innerHTML = '';

  if (tasks.length === 0) {
    todoEmptyEl.hidden = false;
    renderStats();
    return;
  }

  todoEmptyEl.hidden = true;

  tasks.forEach(task => {
    const li = createTaskElement(task);
    todoListEl.appendChild(li);
  });

  renderStats();
}

/* ---- CRUD operations ---- */

/** Add a new task. Returns false if invalid/duplicate. */
function addTask(rawText) {
  const text = rawText.trim();

  if (!text) {
    showTodoMsg('Please enter a task before adding.');
    return false;
  }

  if (isDuplicate(text)) {
    showTodoMsg(`"${text}" is already in your list.`);
    return false;
  }

  hideTodoMsg();
  tasks.push({ id: uid(), text, done: false });
  saveTasks();
  renderTasks();
  return true;
}

/** Toggle done/undone for a task. */
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  saveTasks();
  renderTasks();
}

/** Delete a task by id. */
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

/**
 * Switch a task item to inline edit mode.
 * Replaces the text span with an input field.
 */
function startEditTask(id, li) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const body     = li.querySelector('.todo-item__body');
  const textSpan = li.querySelector('.todo-item__text');

  // Replace text span with input
  const editInput = document.createElement('input');
  editInput.type      = 'text';
  editInput.className = 'todo-item__edit-input';
  editInput.value     = task.text;
  editInput.maxLength = 200;
  editInput.setAttribute('aria-label', 'Edit task text');

  body.replaceChild(editInput, textSpan);
  editInput.focus();
  editInput.select();

  // Disable edit/delete buttons while editing
  const editBtn   = li.querySelector('.edit-btn');
  const deleteBtn = li.querySelector('.delete-btn');
  if (editBtn)   editBtn.disabled   = true;
  if (deleteBtn) deleteBtn.disabled = true;

  // Guard flag: prevents blur from re-triggering commit after Escape/Enter.
  let editSettled = false;

  /** Commit the edit. */
  function commitEdit() {
    if (editSettled) return;
    editSettled = true;

    const newText = editInput.value.trim();

    if (!newText) {
      // Empty — restore original text without saving
      renderTasks();
      return;
    }

    // Duplicate check — exclude the task's own id so it can keep its own text
    if (normalize(newText) !== normalize(task.text) && isDuplicate(newText, id)) {
      showTodoMsg(`"${newText}" already exists in your list.`);
      // Allow the user to keep editing — revert flag so they can commit again
      editSettled = false;
      editInput.focus();
      return;
    }

    hideTodoMsg();
    task.text = newText;
    saveTasks();
    renderTasks();
  }

  /** Cancel edit without saving. */
  function cancelEdit() {
    if (editSettled) return;
    editSettled = true;
    renderTasks(); // re-render restores the original view
  }

  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
  });

  editInput.addEventListener('blur', () => {
    // Small delay so a keyboard commit/cancel settles before blur fires.
    setTimeout(commitEdit, 150);
  });
}

/* ---- Form submission ---- */

todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const added = addTask(todoInput.value);
  if (added) {
    todoInput.value = '';
    todoInput.focus();
  }
});

/* ---- Init ---- */

function initTasks() {
  tasks = loadTasks();
  renderTasks();
}

/* ============================================================
   MODULE 6: QUICK LINKS
   ============================================================ */
const linksListEl     = document.getElementById('links-list');
const addLinkDetails  = document.getElementById('add-link-details');
const addLinkForm     = document.getElementById('add-link-form');
const linkTitleInput  = document.getElementById('link-title-input');
const linkURLInput    = document.getElementById('link-url-input');
const linkMsg         = document.getElementById('link-msg');
const addLinkCancelBtn = document.getElementById('add-link-cancel');

/** In-memory links array. */
let links = [];

/* ---- Persistence ---- */

function saveLinks() {
  // Only save custom (non-default) links to localStorage.
  const custom = links.filter(l => !l.isDefault);
  lsSet(LS_LINKS, custom);
}

function loadLinks() {
  const custom = lsGet(LS_LINKS, []);
  // Validate saved custom links
  const validCustom = Array.isArray(custom)
    ? custom.filter(
        l => l && typeof l.id === 'string'
              && typeof l.title === 'string'
              && typeof l.url === 'string'
      )
    : [];
  // Always start with default links, then append saved custom links
  return [...DEFAULT_LINKS, ...validCustom];
}

/* ---- Render ---- */

/** Pick a simple emoji icon based on hostname. */
function getAutoIcon(url) {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    if (host.includes('google'))    return '🔍';
    if (host.includes('youtube'))   return '▶️';
    if (host.includes('github'))    return '🐙';
    if (host.includes('openai') || host.includes('chatgpt')) return '✨';
    if (host.includes('twitter') || host.includes('x.com'))  return '🐦';
    if (host.includes('linkedin'))  return '💼';
    if (host.includes('reddit'))    return '🤖';
    if (host.includes('notion'))    return '📝';
    if (host.includes('figma'))     return '🎨';
  } catch { /* ignore */ }
  return '🔗';
}

/** Render a single link <li>. */
function createLinkElement(link) {
  const li = document.createElement('li');
  li.className = 'link-item' + (link.isDefault ? '' : ' is-custom');

  const anchor = document.createElement('a');
  anchor.className = 'link-item__anchor';
  anchor.href      = link.url;
  anchor.target    = '_blank';
  anchor.rel       = 'noopener noreferrer';
  // Safe: set via textContent properties
  anchor.setAttribute('aria-label', link.title);

  const iconEl = document.createElement('span');
  iconEl.className = 'link-item__icon';
  iconEl.textContent = link.icon || getAutoIcon(link.url); // safe: textContent

  const titleEl = document.createElement('span');
  titleEl.textContent = link.title; // safe: textContent

  anchor.appendChild(iconEl);
  anchor.appendChild(titleEl);
  li.appendChild(anchor);

  // Delete button — only for custom links
  if (!link.isDefault) {
    const delBtn = document.createElement('button');
    delBtn.className = 'link-item__delete';
    delBtn.textContent = '×';
    delBtn.setAttribute('aria-label', `Remove link: ${link.title}`);
    delBtn.addEventListener('click', (e) => {
      e.preventDefault();
      deleteLink(link.id);
    });
    li.appendChild(delBtn);
  }

  return li;
}

/** Full re-render of quick links. */
function renderLinks() {
  linksListEl.innerHTML = '';
  links.forEach(link => {
    linksListEl.appendChild(createLinkElement(link));
  });
}

/* ---- Link message helper ---- */

let linkMsgTimeout = null;

function showLinkMsg(text) {
  linkMsg.textContent = text;
  linkMsg.hidden = false;
  clearTimeout(linkMsgTimeout);
  linkMsgTimeout = setTimeout(() => {
    linkMsg.hidden = true;
  }, 3500);
}

function hideLinkMsg() {
  clearTimeout(linkMsgTimeout);
  linkMsg.hidden = true;
}

/* ---- CRUD ---- */

/** Add a custom link. */
function addLink(title, rawURL) {
  const cleanTitle = title.trim();
  if (!cleanTitle) {
    showLinkMsg('Please enter a title for the link.');
    return false;
  }

  const safeURL = validateURL(rawURL);
  if (!safeURL) {
    showLinkMsg('Please enter a valid URL starting with http:// or https://');
    return false;
  }

  hideLinkMsg();
  links.push({
    id:        uid(),
    title:     cleanTitle,
    url:       safeURL,
    icon:      getAutoIcon(safeURL),
    isDefault: false,
  });
  saveLinks();
  renderLinks();
  return true;
}

/** Delete a custom link by id. */
function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

/* ---- Form ---- */

addLinkForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const added = addLink(linkTitleInput.value, linkURLInput.value);
  if (added) {
    linkTitleInput.value = '';
    linkURLInput.value   = '';
    addLinkDetails.open  = false; // close the <details>
  }
});

addLinkCancelBtn.addEventListener('click', () => {
  linkTitleInput.value = '';
  linkURLInput.value   = '';
  hideLinkMsg();
  addLinkDetails.open = false;
});

/* ---- Init ---- */

function initLinks() {
  links = loadLinks();
  renderLinks();
}

/* ============================================================
   BOOT — Initialize all modules
   ============================================================ */

/**
 * Apply the saved theme BEFORE any rendering to avoid a flash
 * of the wrong theme. Called synchronously on script load.
 */
(function applyThemeEarly() {
  const saved = lsGet(LS_THEME, 'dark');
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();

/** Main initialization — runs after DOM is ready. */
function init() {
  initTheme();   // Sync toggle button state with current theme
  initClock();   // Start clock + greeting
  initName();    // Load saved name
  initTimer();   // Set up timer display
  initTasks();   // Load tasks from localStorage
  initLinks();   // Load links from localStorage
}

// Run after the DOM is fully parsed.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
