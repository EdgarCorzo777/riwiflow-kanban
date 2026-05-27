// ============================================================
// RiwiFlow — app.js  (SPA, sin recargas de página)
// Un único index.html, dos vistas: #view-login y #view-board
// ============================================================

const API_BASE = "http://localhost:3000";

// ─── State ───────────────────────────────────────────────────
const state = {
  currentUser: null,
  tasks: [],
  users: [],
};

// ─── Session ─────────────────────────────────────────────────
function saveSession(user) {
  localStorage.setItem("riwiflow_user", JSON.stringify(user));
  state.currentUser = user;
}
function loadSession() {
  try {
    const raw = localStorage.getItem("riwiflow_user");
    if (raw) state.currentUser = JSON.parse(raw);
  } catch {
    localStorage.removeItem("riwiflow_user");
  }
}
function clearSession() {
  localStorage.removeItem("riwiflow_user");
  state.currentUser = null;
}
function isAdmin() {
  return state.currentUser?.role === "admin";
}

// ─── Router SPA ──────────────────────────────────────────────
// Muestra una vista y oculta la otra. No recarga la página.
function showView(name) {
  const login = document.getElementById("view-login");
  const board = document.getElementById("view-board");

  if (name === "login") {
    // Login: restaurar body para que tenga el fondo blanco
    document.body.style.height = "";
    document.body.style.overflow = "";
    login.classList.remove("view-hidden");
    board.classList.add("view-hidden");
    document.title = "Login | Riwiflow";
  } else {
    // Board: body debe ser h-screen overflow-hidden flex
    document.body.style.height = "100vh";
    document.body.style.overflow = "hidden";
    login.classList.add("view-hidden");
    board.classList.remove("view-hidden");
    document.title = "Riwiflow Dashboard - Kanban";
  }
}

// ─── API ─────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
async function getUsers() {
  state.users = await apiFetch("/users");
  return state.users;
}
async function getTasks() {
  state.tasks = await apiFetch("/tasks");
  return state.tasks;
}
async function createTask(task) {
  const created = await apiFetch("/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });
  state.tasks.push(created);
  return created;
}
async function updateTask(id, updates) {
  const updated = await apiFetch(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  const idx = state.tasks.findIndex((t) => t.id === id);
  if (idx !== -1) state.tasks[idx] = updated;
  return updated;
}

// ─── Helpers ─────────────────────────────────────────────────
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function userName(userId) {
  const u = state.users.find((u) => u.id === userId);
  return u ? u.name : "Unknown";
}
function userInitials(userId) {
  const u = state.users.find((u) => u.id === userId);
  if (!u) return "?";
  return u.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Toast ───────────────────────────────────────────────────
function showToast(msg, type = "success") {
  document.querySelector(".rw-toast")?.remove();
  const colorClass =
    type === "error"
      ? "bg-error-container text-on-error-container"
      : "bg-primary-container text-on-primary";
  const toast = document.createElement("div");
  toast.className = `rw-toast fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl font-body-sm text-body-sm shadow-lg border border-outline-variant transition-all duration-300 opacity-0 translate-y-2 ${colorClass}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.remove("opacity-0", "translate-y-2"));
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// ============================================================
// ─── LOGIN VIEW ──────────────────────────────────────────────
// ============================================================
function initLoginView() {
  // Limpiar error anterior si existe
  document.getElementById("loginError")?.remove();

  const form = document.getElementById("loginForm");
  if (!form) return;

  // Inyectar div de error una sola vez
  if (!document.getElementById("loginError")) {
    const passwordGroup = document.getElementById("password")?.closest(".space-y-sm");
    const errorDiv = document.createElement("p");
    errorDiv.id = "loginError";
    errorDiv.className =
      "hidden font-body-sm text-body-sm text-error bg-error-container/30 border border-error/30 rounded-lg px-3 py-2";
    passwordGroup?.insertAdjacentElement("afterend", errorDiv);
  }

  // Clonar el form para limpiar listeners anteriores
  const freshForm = form.cloneNode(true);
  form.replaceWith(freshForm);

  // Limpiar campos
  freshForm.reset();

  const submitBtn = freshForm.querySelector("button[type=submit]");

  freshForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const errorEl  = document.getElementById("loginError");

    errorEl.classList.add("hidden");
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Signing in…";

    try {
      await getUsers();
      const user = state.users.find(
        (u) => u.email === email && u.password === password
      );

      if (!user) {
        errorEl.textContent = "Invalid email or password. Please try again.";
        errorEl.classList.remove("hidden");
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Login <span class="material-symbols-outlined text-[18px]">arrow_forward</span>`;
        return;
      }

      saveSession(user);
      showToast(`Welcome back, ${user.name}!`);
      // ← SPA: cambiar vista sin recargar
      await navigateToDashboard();

    } catch {
      errorEl.textContent =
        "Could not connect to server. Is 'node server.js' running on port 3000?";
      errorEl.classList.remove("hidden");
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Login <span class="material-symbols-outlined text-[18px]">arrow_forward</span>`;
    }
  });
}

// ============================================================
// ─── DASHBOARD VIEW ──────────────────────────────────────────
// ============================================================

const COLUMN_MAP = {
  "To Do":       "todo",
  "In Progress": "in-progress",
  "In Review":   "in-review",
  "Done":        "done",
};

const STATUS_LABEL = {
  "todo":        "To Do",
  "in-progress": "In Progress",
  "in-review":   "In Review",
  "done":        "Done",
};

async function initDashboardView() {
  try {
    await Promise.all([getTasks(), getUsers()]);
  } catch {
    showToast("Could not connect to server on port 3000.", "error");
    return;
  }

  setupSidebar();
  setupSearch();
  renderAllColumns();
  injectModal();
  setupNewProjectButton();
}

// ─── Sidebar: user chip + logout ─────────────────────────────
function setupSidebar() {
  // Limpiar si ya existía (por si se navega varias veces)
  document.getElementById("rwUserFooter")?.remove();

  const user    = state.currentUser;
  const sidebar = document.querySelector("#view-board aside");
  if (!sidebar) return;

  const newProjectDiv = sidebar.querySelector(".px-4.mt-auto");
  const footerDiv = document.createElement("div");
  footerDiv.id = "rwUserFooter";
  footerDiv.className = "px-4 space-y-2 mb-3";
  footerDiv.innerHTML = `
    <div class="flex items-center gap-2 px-3 py-2 bg-surface-container rounded-full border border-outline-variant">
      <div class="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary font-label-sm text-label-sm shrink-0 select-none">
        ${userInitials(user.id)}
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-label-md text-label-md text-on-surface truncate">${escapeHtml(user.name)}</p>
        <p class="font-label-sm text-label-sm text-outline capitalize">${user.role}</p>
      </div>
    </div>
    <button id="btnLogout"
      class="w-full text-left px-4 py-2 font-body-sm text-body-sm text-secondary hover:text-error hover:bg-error-container/20 rounded-lg transition-colors flex items-center gap-2">
      <span class="material-symbols-outlined" style="font-size:16px">logout</span> Sign out
    </button>
  `;
  sidebar.insertBefore(footerDiv, newProjectDiv || null);

  document.getElementById("btnLogout").addEventListener("click", () => {
    clearSession();
    state.tasks = [];
    state.users = [];
    // Limpiar modal si existe
    document.getElementById("rwModalOverlay")?.remove();
    document.getElementById("rwUserFooter")?.remove();
    showToast("Signed out.");
    // ← SPA: volver al login sin recargar
    showView("login");
    initLoginView();
  });
}

// ─── "New Project" button ─────────────────────────────────────
function setupNewProjectButton() {
  const btn = document.getElementById("btnNewProject");
  if (!btn) return;

  // Clonar para limpiar listeners anteriores
  const fresh = btn.cloneNode(true);
  btn.replaceWith(fresh);

  if (!isAdmin()) {
    fresh.style.display = "none";
    return;
  }
  fresh.style.display = "";
  fresh.addEventListener("click", () => openModal(null, "todo"));
}

// ─── Search ──────────────────────────────────────────────────
function setupSearch() {
  const input = document.querySelector(
    "#view-board input[placeholder='Search tasks or files...']"
  );
  if (!input) return;
  // Clonar para evitar listeners duplicados
  const fresh = input.cloneNode(true);
  input.replaceWith(fresh);
  let debounce;
  fresh.addEventListener("input", (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => renderAllColumns(e.target.value.trim()), 200);
  });
}

// ─── Render columns ───────────────────────────────────────────
function renderAllColumns(filter = "") {
  document.querySelectorAll("#view-board .kanban-column").forEach((col) => {
    const title  = col.querySelector("h3")?.textContent?.trim();
    const status = COLUMN_MAP[title];
    if (!status) return;
    renderColumn(col, status, filter);
  });
}

function renderColumn(colEl, status, filter = "") {
  let tasks = state.tasks.filter((t) => t.status === status);
  if (filter) {
    const q = filter.toLowerCase();
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }

  // Badge de conteo
  const badge = colEl.querySelector(".flex.items-center.gap-2 span.rounded-full");
  if (badge) badge.textContent = tasks.length;

  // Contenedor de tarjetas
  const container = colEl.querySelector(".flex-1");
  if (!container) return;
  container.innerHTML = "";

  if (tasks.length === 0) {
    container.innerHTML = `<p class="font-body-sm text-body-sm text-outline text-center py-8 opacity-60">No tasks here</p>`;
  } else {
    tasks.forEach((task) => container.appendChild(buildCard(task)));
  }

  setupColumnAddButton(colEl, status);
}

// ─── Build task card ─────────────────────────────────────────
function buildCard(task) {
  const mine       = task.userId === state.currentUser.id;
  const canEdit    = isAdmin() || mine;
  const isDone     = task.status === "done";
  const isProgress = task.status === "in-progress";

  const tagBg = isDone
    ? "bg-secondary-container text-secondary"
    : "bg-primary-fixed text-on-primary-fixed-variant";

  const assignedUser = state.users.find((u) => u.id === task.userId);
  const tagLabel     = assignedUser ? assignedUser.name.split(" ")[0] : "Unassigned";

  const card = document.createElement("div");
  card.className = `task-card bg-surface ${isProgress ? "border-l-4 border-l-primary " : ""}border border-outline-variant rounded-xl p-md shadow-sm${isDone ? " opacity-80" : ""}`;

  card.innerHTML = `
    <div class="flex items-start justify-between mb-xs">
      <span class="${tagBg} px-2 py-0.5 rounded-full font-label-sm text-label-sm">${escapeHtml(tagLabel)}</span>
      ${canEdit
        ? `<button class="rw-edit-btn material-symbols-outlined text-outline hover:text-primary transition-colors" style="font-size:16px" data-id="${task.id}">edit</button>`
        : `<span class="w-4 h-4"></span>`}
    </div>
    <h4 class="font-label-md text-label-md text-on-surface mb-xs${isDone ? " line-through" : ""}">${escapeHtml(task.title)}</h4>
    <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">${escapeHtml(task.description)}</p>
    <div class="mt-md flex items-center justify-between">
      <div class="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary border-2 border-surface select-none"
           style="font-size:10px;font-weight:700" title="${escapeHtml(userName(task.userId))}">
        ${userInitials(task.userId)}
      </div>
      ${isDone
        ? `<span class="font-label-sm text-label-sm text-outline">Completed</span>`
        : `<span class="font-label-sm text-label-sm text-outline flex items-center gap-1">
             <span class="material-symbols-outlined" style="font-size:14px">schedule</span>
             ${escapeHtml(STATUS_LABEL[task.status])}
           </span>`}
    </div>
  `;

  if (canEdit) {
    card.querySelector(".rw-edit-btn").addEventListener("click", () => openModal(task.id));
  }
  return card;
}

// ─── Column add button (admin) ────────────────────────────────
function setupColumnAddButton(colEl, status) {
  if (!isAdmin()) return;
  const header = colEl.querySelector(".flex.items-center.justify-between");
  if (!header) return;

  header.querySelector(".rw-col-add")?.remove();

  const addBtn = document.createElement("button");
  addBtn.className = "rw-col-add material-symbols-outlined text-outline hover:text-primary transition-colors";
  addBtn.style.fontSize = "18px";
  addBtn.textContent = "add";
  addBtn.title = "Add task to this column";
  addBtn.addEventListener("click", () => openModal(null, status));

  const moreBtn = header.querySelector("button");
  if (moreBtn) header.insertBefore(addBtn, moreBtn);
  else header.appendChild(addBtn);
}

// ============================================================
// ─── MODAL ───────────────────────────────────────────────────
// ============================================================
let editingTaskId = null;

function injectModal() {
  // Limpiar modal previo si existe
  document.getElementById("rwModalOverlay")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "rwModalOverlay";
  overlay.className =
    "fixed inset-0 z-[60] hidden items-center justify-center bg-on-background/50 backdrop-blur-sm p-4";

  overlay.innerHTML = `
    <div id="rwModal"
      class="bg-surface border border-outline-variant rounded-xl w-full max-w-md p-xl shadow-2xl transition-all duration-200 scale-95 opacity-0">
      <div class="flex items-center justify-between mb-lg">
        <h2 id="rwModalTitle" class="font-headline-md text-headline-md text-on-surface">Task</h2>
        <button id="rwModalClose" class="material-symbols-outlined text-outline hover:text-on-surface transition-colors">close</button>
      </div>
      <div id="rwTaskForm" class="space-y-md">
        <div id="rwFieldTitle">
          <label class="block font-label-md text-label-md text-on-surface mb-xs">Title</label>
          <input id="rwTitle" type="text" placeholder="Task title"
            class="w-full px-md py-sm bg-surface-container border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label class="block font-label-md text-label-md text-on-surface mb-xs">Description</label>
          <textarea id="rwDesc" rows="3" placeholder="Describe the task…"
            class="w-full px-md py-sm bg-surface-container border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"></textarea>
        </div>
        <div>
          <label class="block font-label-md text-label-md text-on-surface mb-xs">Status</label>
          <select id="rwStatus"
            class="w-full px-md py-sm bg-surface-container border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="in-review">In Review</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div id="rwFieldAssign">
          <label class="block font-label-md text-label-md text-on-surface mb-xs">Assigned to</label>
          <select id="rwUserId"
            class="w-full px-md py-sm bg-surface-container border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30">
          </select>
        </div>
        <div class="flex gap-sm justify-end pt-sm">
          <button type="button" id="rwCancelBtn"
            class="px-lg py-sm border border-outline-variant rounded-lg font-label-md text-label-md text-secondary hover:bg-surface-container transition-colors">
            Cancel
          </button>
          <button type="button" id="rwSaveBtn"
            class="px-lg py-sm bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center gap-xs">
            <span class="material-symbols-outlined" style="font-size:16px">save</span> Save
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("rwModalClose").addEventListener("click", closeModal);
  document.getElementById("rwCancelBtn").addEventListener("click", closeModal);
  document.getElementById("rwSaveBtn").addEventListener("click", handleSave);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
}

function populateUserSelect() {
  const sel = document.getElementById("rwUserId");
  if (!sel) return;
  sel.innerHTML = state.users
    .map((u) => `<option value="${u.id}">${escapeHtml(u.name)} (${u.role})</option>`)
    .join("");
}

function openModal(taskId = null, defaultStatus = "todo") {
  editingTaskId = taskId;
  populateUserSelect();

  const overlay     = document.getElementById("rwModalOverlay");
  const modal       = document.getElementById("rwModal");
  const fieldTitle  = document.getElementById("rwFieldTitle");
  const fieldAssign = document.getElementById("rwFieldAssign");

  if (taskId !== null) {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    document.getElementById("rwModalTitle").textContent = "Edit Task";
    document.getElementById("rwTitle").value  = task.title;
    document.getElementById("rwDesc").value   = task.description;
    document.getElementById("rwStatus").value = task.status;
    document.getElementById("rwUserId").value = task.userId;

    if (isAdmin()) {
      fieldTitle.classList.remove("hidden");
      fieldAssign.classList.remove("hidden");
    } else {
      fieldTitle.classList.add("hidden");
      fieldAssign.classList.add("hidden");
    }
  } else {
    document.getElementById("rwModalTitle").textContent = "New Task";
    document.getElementById("rwTitle").value  = "";
    document.getElementById("rwDesc").value   = "";
    document.getElementById("rwStatus").value = defaultStatus;
    document.getElementById("rwUserId").value = state.users[0]?.id ?? 1;
    fieldTitle.classList.remove("hidden");
    fieldAssign.classList.remove("hidden");
  }

  overlay.classList.remove("hidden");
  overlay.classList.add("flex");
  requestAnimationFrame(() => {
    modal.classList.remove("scale-95", "opacity-0");
    modal.classList.add("scale-100", "opacity-100");
  });
}

function closeModal() {
  const overlay = document.getElementById("rwModalOverlay");
  const modal   = document.getElementById("rwModal");
  if (!overlay || !modal) return;
  modal.classList.remove("scale-100", "opacity-100");
  modal.classList.add("scale-95", "opacity-0");
  setTimeout(() => {
    overlay.classList.add("hidden");
    overlay.classList.remove("flex");
  }, 200);
}

async function handleSave() {
  const btn = document.getElementById("rwSaveBtn");
  btn.disabled = true;
  btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:16px">autorenew</span> Saving…`;

  try {
    if (editingTaskId === null) {
      if (!isAdmin()) { showToast("Only admins can create tasks.", "error"); return; }
      await createTask({
        title:       document.getElementById("rwTitle").value.trim(),
        description: document.getElementById("rwDesc").value.trim(),
        status:      document.getElementById("rwStatus").value,
        userId:      parseInt(document.getElementById("rwUserId").value, 10),
      });
      showToast("Task created!");
    } else {
      const updates = {
        description: document.getElementById("rwDesc").value.trim(),
        status:      document.getElementById("rwStatus").value,
      };
      if (isAdmin()) {
        updates.title  = document.getElementById("rwTitle").value.trim();
        updates.userId = parseInt(document.getElementById("rwUserId").value, 10);
      }
      await updateTask(editingTaskId, updates);
      showToast("Task updated!");
    }
    closeModal();
    renderAllColumns();
  } catch {
    showToast("Error saving task. Check server.", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:16px">save</span> Save`;
  }
}

// ============================================================
// ─── NAVEGACIÓN SPA ──────────────────────────────────────────
// ============================================================
async function navigateToDashboard() {
  showView("board");
  await initDashboardView();
}

function navigateToLogin() {
  showView("login");
  initLoginView();
}

// ============================================================
// ─── BOOT ────────────────────────────────────────────────────
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  loadSession();

  if (state.currentUser) {
    // Ya hay sesión → ir directo al board
    navigateToDashboard();
  } else {
    // Sin sesión → mostrar login
    showView("login");
    initLoginView();
  }
});
