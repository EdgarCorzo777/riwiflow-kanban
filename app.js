const API_URL = 'http://localhost:3000';
const state = { users: [], tasks: [], currentUser: null };

const userAvatars = {
  1: "https://i.pinimg.com/736x/df/6f/f1/df6ff18dad88a147fafffab7f3616199.jpg",
  2: "https://lh3.googleusercontent.com/aida-public/AB6AXuD8_17Xd9poBFvBCwXx25-JDPMSaFQNMUYLnyIhJkS_7NrlsW0MG9R2vorE3CfNKMkE4oX4L6dopgc_F9_Mj5ieYPiBlGxLCK7vM7uFvfyHpx3ptCHdVbdU7CMDBms9ZPGXFfahQnM9P9g9yXvOtdU1ggtRwk5DPOV-sVnlAxxRUtrtEM23JonEusSqFOP1BU6Xt0wVnfWMpW6XxnekjrGmBQ0Qz4NJO8ogLugD809Cxp7wA4UIkAEYeZWpAJr8ZcVWbd46c9Rh1GI3",
  3: "https://lh3.googleusercontent.com/aida-public/AB6AXuAG8Jxa-wc0IqXzwH5Eb-olQWjFfMH6FQefHNg8x204_qA5sVV-TBUkIl8wK1XSgpI1pH94oGq5yB9UyZeJy-d3z2R12xUy54PTHs5JoHE30eaqCX5BeKws1PCMN0TntyKW0UPojlBnG1xGY4-UQTrCOIhR7cF_zb7rj-vnemMaZQM9Xzk-F73_Q6MYD0msF1j-Tkjyrn2XQvujydcVmhnZnMOGv6P1Ep9OaJYUghQE93UdvLGAJptOXzhk3FK3LGn988gRhSTXAiBu"
};
const defaultAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuBBuiKEYj12lJcVG4nXyKu-Ai-H1-QlxIX2zT1jzk7AAD9j-20g91vBWIy1_5PsuU1H-g9vErAWuJJg3lohFPbVJhWG1ZwwSI2BxdTBpANzBluRwLzmBbnpSae8GQTTdZ1GoRzw9ZDPsxzDwyvkzduAyTDl3TN4KqDP45-VjqA0fxNIy5VVE5a8OP1OTlymungwOO-QcyUBGbbs24dxy1hwAoNbSe-uapYTlmCQYk70fcbq2y5m0xQhtlAZFbH8AX739jEY5b-ZtW8N";

// --- API LAYER ---
async function apiRequest(endpoint, method = 'GET', body = null, errorMsg = "API Error") {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_URL}${endpoint}`, opts);
    if (!res.ok) throw new Error(`${errorMsg}: status ${res.status}`);
    return method === 'DELETE' ? true : await res.json();
  } catch (err) {
    console.error(err);
    showToast(errorMsg, "error");
    return null;
  }
}

const fetchUsers = () => apiRequest('/users', 'GET', null, "Error connecting to server database.").then(d => d && (state.users = d));
const fetchTasks = () => apiRequest('/tasks', 'GET', null, "Error loading project tasks.").then(d => d && (state.tasks = d));

async function createTask(taskData) {
  if (await apiRequest('/tasks', 'POST', taskData, "Failed to create the task.")) {
    await fetchTasks();
    showToast("Task created successfully!", "success");
  }
}

async function updateTask(taskId, updatedFields, silent = false) {
  if (await apiRequest(`/tasks/${taskId}`, 'PATCH', updatedFields, "Failed to update the task.")) {
    await fetchTasks();
    if (!silent) showToast("Task updated successfully!", "success");
  }
}

async function deleteTask(taskId) {
  if (await apiRequest(`/tasks/${taskId}`, 'DELETE', null, "Failed to delete the task.")) {
    await fetchTasks();
    showToast("Task deleted successfully!", "success");
  }
}

async function createUser(userData) {
  if (await apiRequest('/users', 'POST', userData, "Failed to create the user.")) {
    await fetchUsers();
    showToast("User created successfully!", "success");
  }
}

async function updateUser(userId, updatedFields) {
  if (await apiRequest(`/users/${userId}`, 'PATCH', updatedFields, "Failed to update the user.")) {
    await fetchUsers();
    showToast("User updated successfully!", "success");
  }
}

async function deleteUser(userId) {
  if (await apiRequest(`/users/${userId}`, 'DELETE', null, "Failed to delete the user.")) {
    await fetchUsers();
    showToast("User deleted successfully!", "success");
  }
}

// --- ROUTER ---
async function router() {
  const container = document.getElementById('app');
  const stored = localStorage.getItem('riwiflow_user');
  state.currentUser = stored ? JSON.parse(stored) : null;
  const hash = window.location.hash || '#/login';

  if ((hash === '#/dashboard' || hash === '#/team') && !state.currentUser) {
    window.location.hash = '#/login';
    return;
  }
  if (hash === '#/team' && state.currentUser?.role !== 'admin') {
    window.location.hash = '#/dashboard';
    return;
  }
  if (hash === '#/login' && state.currentUser) {
    window.location.hash = '#/dashboard';
    return;
  }

  await fetchUsers();
  await fetchTasks();

  if (hash === '#/login') {
    document.title = "Riwiflow | Login";
    renderLoginView(container);
  } else if (hash === '#/dashboard') {
    document.title = "Riwiflow | Dashboard";
    renderDashboardView(container, 'board');
  } else if (hash === '#/team') {
    document.title = "Riwiflow | Team Members";
    renderDashboardView(container, 'team');
  } else {
    window.location.hash = '#/login';
  }
}

window.addEventListener('DOMContentLoaded', router);
window.addEventListener('hashchange', router);

// --- VIEWS ---
function renderLoginView(container) {
  container.innerHTML = '';
  document.body.className = "bg-surface-container-lowest text-on-surface min-h-screen";
  container.className = "min-h-screen flex flex-col";
  container.innerHTML = `
    <main class="flex-grow flex items-center justify-center px-gutter py-xxl z-10">
      <div class="w-full max-w-[440px] space-y-xl">
        <div class="text-center space-y-md">
          <h1 class="font-headline-md text-headline-md font-bold text-primary tracking-tight">Riwiflow</h1>
          <p class="font-body-md text-body-md text-on-surface-variant">Sign in to your professional workspace</p>
        </div>
        <div class="bg-surface-container-lowest border border-outline-variant p-xl rounded-xl space-y-lg transition-all">
          <form class="space-y-lg" id="loginForm">
            <div class="space-y-sm">
              <label class="font-label-md text-label-md text-on-surface" for="email">Email address</label>
              <input class="w-full px-md py-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface input-focus-ring transition-all placeholder:text-outline" id="email" name="email" placeholder="name@company.com" required type="email" />
            </div>
            <div class="space-y-sm">
              <div class="flex justify-between items-center">
                <label class="font-label-md text-label-md text-on-surface" for="password">Password</label>
                <a class="font-label-md text-label-md text-primary hover:underline transition-all" href="#">Forgot password?</a>
              </div>
              <input class="w-full px-md py-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface input-focus-ring transition-all placeholder:text-outline" id="password" name="password" placeholder="••••••••" required type="password" />
            </div>
            <div id="loginError" class="text-error font-body-sm text-body-sm hidden flex items-center gap-xs">
              <span class="material-symbols-outlined text-[16px]">error</span>
              <span id="loginErrorMessage">Invalid email or password.</span>
            </div>
            <div class="pt-sm">
              <button class="w-full bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md py-md px-lg rounded-lg transition-all active:scale-[0.98] duration-150 flex items-center justify-center gap-sm" type="submit">
                Login <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </form>
          <div class="relative py-sm"><div class="absolute inset-0 flex items-center"><div class="w-full border-t border-outline-variant"></div></div><div class="relative flex justify-center text-label-sm"><span class="bg-surface-container-lowest px-md text-outline font-label-sm uppercase tracking-widest">or continue with</span></div></div>
          <div class="grid grid-cols-1 gap-md">
            <button type="button" class="w-full flex items-center justify-center gap-md py-md border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors duration-200">
              <img alt="Google" class="w-4 h-4 opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4MKWoYfBIsxFaqncSN9YxR9mdXQGZNMC1EJDT5yAh5A5R7NXO24MRfA2bF0BxpLFdOJLIlAof80HOr4HokeP6RalmMOUP2rfQdl3XiQ4NoHX37q7XV75Y8mHyjT-0PziGdPkI9qXCMmNzMVVN-ZQUdWwMo6nYIE9qAI22sos0F8nFKx2zlwN1HYzEky_3nI6UP8FAT6bwNH0p2-0Yi3teyjDUPvFHOJwCiAgh-b14qx97Qfr8mlseGFe9mamhHBn8i9WZVkS0Zdjc" /> Sign in with Google
            </button>
          </div>
        </div>
        <div class="text-center"><p class="font-body-sm text-body-sm text-on-surface-variant">Don't have an account? <a class="text-primary font-label-md hover:underline" href="#">Create an account</a></p></div>
      </div>
    </main>
    <div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div class="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-fixed/20 blur-[120px] rounded-full"></div>
      <div class="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-primary-fixed/10 blur-[100px] rounded-full"></div>
    </div>
  `;
  document.getElementById('loginForm').addEventListener('submit', handleManualLogin);
}

function handleManualLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('loginError');
  const errorMsg = document.getElementById('loginErrorMessage');
  errorDiv.classList.add('hidden');

  const u = state.users.find(x => x.email.toLowerCase() === email.toLowerCase());
  if (!u) {
    errorMsg.textContent = "Email address not registered.";
    errorDiv.classList.remove('hidden');
    showToast("Email address not registered.", "error");
    return;
  }
  if (u.password !== password) {
    errorMsg.textContent = "Incorrect password. Please try again.";
    errorDiv.classList.remove('hidden');
    showToast("Incorrect password.", "error");
    return;
  }

  localStorage.setItem('riwiflow_user', JSON.stringify(u));
  state.currentUser = u;
  showToast(`Welcome back, ${u.name}!`, "success");
  window.location.hash = '#/dashboard';
}

function renderDashboardView(container, subView = 'board') {
  container.innerHTML = '';
  document.body.className = "bg-background text-on-background overflow-hidden h-screen";
  container.className = "h-full w-full flex overflow-hidden";

  container.innerHTML = `
    <aside class="hidden md:flex flex-col pt-md pb-xl gap-xs h-full bg-surface-container-low border-r border-outline-variant w-[280px] shrink-0">
      <div class="px-gutter mb-xl flex items-center justify-between">
        <div>
          <h1 class="font-headline-md text-headline-md font-bold text-primary">Riwiflow</h1>
          <p class="font-body-sm text-body-sm text-on-surface-variant">Product Team</p>
        </div>
      </div>
      <nav class="flex-1 space-y-1">
        <a class="flex items-center ${subView === 'board' ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'text-secondary hover:text-primary hover:bg-primary-container/10'} rounded-lg mx-2 px-4 py-3 font-body-sm text-body-sm transition-all ${subView === 'board' ? 'scale-[0.98]' : ''}" href="#/dashboard">
          <span class="material-symbols-outlined mr-3">dashboard</span><span>Dashboard</span>
        </a>
        <a class="flex items-center text-secondary hover:text-primary hover:bg-primary-container/10 px-4 py-3 mx-2 font-body-sm text-body-sm rounded-lg transition-all" href="javascript:void(0)">
          <span class="material-symbols-outlined mr-3">assignment</span><span>Projects</span>
        </a>
        ${state.currentUser.role === 'admin' ? `
        <a class="flex items-center ${subView === 'team' ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'text-secondary hover:text-primary hover:bg-primary-container/10'} px-4 py-3 mx-2 font-body-sm text-body-sm rounded-lg transition-all ${subView === 'team' ? 'scale-[0.98]' : ''}" href="#/team">
          <span class="material-symbols-outlined mr-3">group</span><span>Team</span>
        </a>` : `
        <a class="flex items-center text-secondary hover:text-primary hover:bg-primary-container/10 px-4 py-3 mx-2 font-body-sm text-body-sm rounded-lg transition-all" href="javascript:void(0)">
          <span class="material-symbols-outlined mr-3">group</span><span>Team</span>
        </a>`}
        <a class="flex items-center text-secondary hover:text-primary hover:bg-primary-container/10 px-4 py-3 mx-2 font-body-sm text-body-sm rounded-lg transition-all" href="javascript:void(0)">
          <span class="material-symbols-outlined mr-3">bar_chart</span><span>Reports</span>
        </a>
        <a class="flex items-center text-secondary hover:text-primary hover:bg-primary-container/10 px-4 py-3 mx-2 font-body-sm text-body-sm rounded-lg transition-all" href="javascript:void(0)">
          <span class="material-symbols-outlined mr-3">settings</span><span>Settings</span>
        </a>
      </nav>
      ${state.currentUser.role === 'admin' ? `
      <div class="px-4 mb-4">
        <button id="sidebarCreateBtn" class="w-full bg-primary text-on-primary py-3 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">
          <span class="material-symbols-outlined">add</span>New Task
        </button>
      </div>` : ''}
      <div class="px-4 mt-auto border-t border-outline-variant pt-4 flex flex-col gap-sm">
        <div class="flex items-center gap-sm">
          <img src="${userAvatars[state.currentUser.id] || defaultAvatar}" alt="Profile" class="w-9 h-9 rounded-full object-cover border border-outline-variant"/>
          <div class="min-w-0">
            <p class="font-label-md text-label-md text-on-surface truncate">${state.currentUser.name}</p>
            <span class="inline-block bg-primary-container text-on-primary font-label-sm text-[10px] px-2 py-0.5 rounded-full capitalize">${state.currentUser.role}</span>
          </div>
        </div>
        <button id="logoutBtn" class="w-full text-secondary hover:text-error hover:bg-error-container/10 py-2.5 rounded-lg font-body-sm text-body-sm flex items-center justify-center gap-2 transition-all">
          <span class="material-symbols-outlined text-[18px]">logout</span>Logout
        </button>
      </div>
    </aside>
    <main class="flex-grow flex flex-col min-w-0 h-full">
      <header class="flex justify-between items-center h-16 px-gutter w-full bg-surface border-b border-outline-variant z-40">
        <div class="flex items-center gap-4 flex-1">
          <div class="relative max-w-md w-full">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input id="searchTasks" class="w-full pl-10 pr-4 py-2 bg-surface-container border border-outline-variant rounded-full font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Search tasks or files..." type="text" />
          </div>
        </div>
        <div class="flex items-center gap-4 ml-4">
          <button class="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-colors">notifications</button>
          <button class="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-colors">help_outline</button>
          <img alt="User profile" class="w-8 h-8 rounded-full border border-outline-variant object-cover" src="${userAvatars[state.currentUser.id] || defaultAvatar}" />
        </div>
      </header>
      <div id="boardColumnsContainer" class="flex-1 overflow-x-auto p-gutter custom-scrollbar bg-background"></div>
    </main>
    <div id="taskModalOverlay" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center hidden opacity-0 transition-opacity duration-300 pointer-events-none">
      <div class="bg-surface-container-lowest border border-outline-variant p-xl rounded-2xl w-full max-w-[500px] shadow-2xl space-y-lg transform scale-95 transition-transform duration-300">
        <div class="flex items-center justify-between border-b border-outline-variant pb-md">
          <h3 id="modalTitleText" class="font-headline-md text-headline-md font-bold text-primary">Create New Task</h3>
          <button id="closeModalBtn" class="material-symbols-outlined text-outline hover:bg-surface-container-low p-1.5 rounded-full">close</button>
        </div>
        <form id="taskForm" class="space-y-md">
          <input type="hidden" id="modalTaskId" value=""/>
          <div class="space-y-sm">
            <label class="font-label-md text-label-md text-on-surface" for="taskTitle">Task Title</label>
            <input class="w-full px-md py-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface input-focus-ring transition-all placeholder:text-outline" id="taskTitle" name="title" placeholder="Enter task summary..." required type="text" />
          </div>
          <div class="space-y-sm">
            <label class="font-label-md text-label-md text-on-surface" for="taskDesc">Description</label>
            <textarea rows="3" class="w-full px-md py-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface input-focus-ring transition-all placeholder:text-outline resize-none" id="taskDesc" name="description" placeholder="Describe technical details..." required></textarea>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div class="space-y-sm">
              <label class="font-label-md text-label-md text-on-surface" for="taskStatus">Status</label>
              <select class="w-full px-md py-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface input-focus-ring transition-all" id="taskStatus" name="status" required>
                <option value="todo">To Do</option><option value="in progress">In Progress</option><option value="in review">In Review</option><option value="done">Done</option>
              </select>
            </div>
            <div class="space-y-sm">
              <label class="font-label-md text-label-md text-on-surface" for="taskAssignee">Assignee</label>
              <select class="w-full px-md py-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface input-focus-ring transition-all" id="taskAssignee" name="userId" required></select>
            </div>
          </div>
          <div class="flex items-center justify-between pt-sm">
            <div class="flex items-center gap-sm">
              <input type="checkbox" id="taskStarred" class="rounded border-outline-variant text-primary focus:ring-primary/20 w-4 h-4"/>
              <label for="taskStarred" class="font-label-md text-label-md text-on-surface cursor-pointer select-none">Mark as Starred Priority</label>
            </div>
          </div>
          <div class="flex items-center justify-between border-t border-outline-variant pt-lg mt-lg">
            <div>
              <button id="deleteTaskBtn" type="button" class="hidden text-error hover:bg-error-container/10 px-md py-3 rounded-lg font-label-md text-label-md transition-all flex items-center gap-xs">
                <span class="material-symbols-outlined text-[18px]">delete</span>Delete Task
              </button>
            </div>
            <div class="flex items-center gap-md">
              <button id="cancelModalBtn" type="button" class="px-md py-3 border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors">Cancel</button>
              <button type="submit" class="bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md py-3 px-lg rounded-lg transition-all active:scale-[0.98]">Save Changes</button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <div id="userModalOverlay" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center hidden opacity-0 transition-opacity duration-300 pointer-events-none">
      <div class="bg-surface-container-lowest border border-outline-variant p-xl rounded-2xl w-full max-w-[450px] shadow-2xl space-y-lg transform scale-95 transition-transform duration-300">
        <div class="flex items-center justify-between border-b border-outline-variant pb-md">
          <h3 id="userModalTitleText" class="font-headline-md text-headline-md font-bold text-primary">Add New Member</h3>
          <button id="closeUserModalBtn" class="material-symbols-outlined text-outline hover:bg-surface-container-low p-1.5 rounded-full">close</button>
        </div>
        <form id="userForm" class="space-y-md">
          <input type="hidden" id="modalUserId" value=""/>
          <div class="space-y-sm">
            <label class="font-label-md text-label-md text-on-surface" for="userName">Full Name</label>
            <input class="w-full px-md py-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface input-focus-ring transition-all placeholder:text-outline" id="userName" name="name" placeholder="e.g. John Doe" required type="text" />
          </div>
          <div class="space-y-sm">
            <label class="font-label-md text-label-md text-on-surface" for="userEmail">Email Address</label>
            <input class="w-full px-md py-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface input-focus-ring transition-all placeholder:text-outline" id="userEmail" name="email" placeholder="john.doe@company.com" required type="email" />
          </div>
          <div class="space-y-sm">
            <label class="font-label-md text-label-md text-on-surface" for="userPassword">Password</label>
            <input class="w-full px-md py-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface input-focus-ring transition-all placeholder:text-outline" id="userPassword" name="password" placeholder="••••••••" required type="password" />
          </div>
          <div class="space-y-sm">
            <label class="font-label-md text-label-md text-on-surface" for="userRole">Role</label>
            <select class="w-full px-md py-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface input-focus-ring transition-all" id="userRole" name="role" required>
              <option value="coder">Coder</option><option value="admin">Admin</option>
            </select>
          </div>
          <div class="flex items-center justify-end gap-md border-t border-outline-variant pt-lg mt-lg">
            <button id="cancelUserModalBtn" type="button" class="px-md py-3 border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors">Cancel</button>
            <button type="submit" class="bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md py-3 px-lg rounded-lg transition-all active:scale-[0.98]">Save Member</button>
          </div>
        </form>
      </div>
    </div>
  `;

  populateAssigneesDropdown();
  const boardCol = document.getElementById('boardColumnsContainer');
  if (subView === 'board') {
    boardCol.className = "flex-1 overflow-x-auto p-gutter custom-scrollbar bg-background";
    renderKanbanBoard();
  } else {
    boardCol.className = "flex-1 overflow-y-auto p-gutter custom-scrollbar bg-background";
    renderTeamView();
  }
  bindDashboardEvents();
}

function populateAssigneesDropdown() {
  const el = document.getElementById('taskAssignee');
  if (!el) return;
  el.innerHTML = state.users.map(u => `<option value="${u.id}">${u.name} (${u.role === 'admin' ? 'Admin' : 'Coder'})</option>`).join('');
}

// --- BOARD RENDERING ---
function renderKanbanBoard() {
  const container = document.getElementById('boardColumnsContainer');
  if (!container) return;

  const cols = [
    { id: 'todo', title: 'To Do', border: '', badge: 'bg-surface-container-high text-on-surface-variant' },
    { id: 'in progress', title: 'In Progress', border: 'border-l-4 border-l-primary', badge: 'bg-primary-container text-on-primary' },
    { id: 'in review', title: 'In Review', border: '', badge: 'bg-surface-container-high text-on-surface-variant' },
    { id: 'done', title: 'Done', border: '', badge: 'bg-surface-container-high text-on-surface-variant' }
  ];

  container.innerHTML = `<div class="flex gap-gutter h-full">${cols.map(c => {
    const tasks = state.tasks.filter(t => t.status === c.id);
    return `
      <div class="kanban-column flex flex-col w-1/4 h-full">
        <div class="flex items-center justify-between mb-md">
          <div class="flex items-center gap-2">
            <h3 class="font-title-sm text-title-sm text-on-surface">${c.title}</h3>
            <span class="${c.badge} px-2 py-0.5 rounded-full font-label-sm text-label-sm">${tasks.length}</span>
          </div>
          <button class="material-symbols-outlined text-outline">more_horiz</button>
        </div>
        <div id="col-list-${c.id.replace(' ', '-')}" class="task-list-zone flex-1 space-y-md p-2 bg-surface-container-low/50 rounded-xl overflow-y-auto custom-scrollbar min-h-[300px]" data-status="${c.id}">
          ${tasks.length === 0 ? `
            <div class="flex flex-col items-center justify-center h-full py-8 text-outline opacity-60">
              <span class="material-symbols-outlined text-[32px] mb-xs">assignment_turned_in</span>
              <p class="font-body-sm text-body-sm">No tasks</p>
            </div>` : ''}
        </div>
      </div>`;
  }).join('')}</div>`;

  cols.forEach(c => {
    const listZone = document.getElementById(`col-list-${c.id.replace(' ', '-')}`);
    state.tasks.filter(t => t.status === c.id).forEach(t => {
      listZone.appendChild(createTaskCardElement(t, c.border));
    });
  });

  initDragAndDrop();
}

// --- CARD HELPERS ---
function deriveCategory(t) {
  const title = (t.title || '').toLowerCase();
  if (title.match(/flow|style|ui|wireframe/)) return "Design";
  if (title.match(/api|setup|code|deploy/)) return "Engineering";
  if (title.match(/competitor|analysis|research/)) return "Research";
  if (title.match(/pricing|tier|plan/)) return "Product";
  if (title.match(/social|graphics|media/)) return "Marketing";
  if (title.match(/privacy|policy|legal|gdpr/)) return "Legal";
  if (title.match(/workspace|config|ops/)) return "Ops";
  return ["Engineering", "Design", "Research", "Marketing", "Product", "Legal", "Ops"][parseInt(t.id) % 7] || "Engineering";
}

const deriveTimeEstimation = t => t.status === 'done' ? 'Completed' : (String(t.id) === '3' ? 'Today' : (["2d", "5d", "Today", "3d", "1w", "Tomorrow"][parseInt(t.id) % 6] || "2d"));
const deriveStarred = t => String(t.id) === '3' || String(t.id) === '5' || !!t.starred;

function createTaskCardElement(task, borderClass) {
  const card = document.createElement('div');
  card.id = `task-card-${task.id}`;
  card.className = `task-card bg-surface border border-outline-variant rounded-xl p-md shadow-sm cursor-pointer select-none relative ${borderClass || ''}`;

  const assignee = state.users.find(u => String(u.id) === String(task.userId));
  const name = assignee ? assignee.name : "Unassigned";
  const category = deriveCategory(task);
  const time = deriveTimeEstimation(task);
  const starred = deriveStarred(task);

  const isDraggable = state.currentUser.role === 'admin' || (state.currentUser.role === 'coder' && String(task.userId) === String(state.currentUser.id));
  card.setAttribute('draggable', isDraggable ? 'true' : 'false');
  card.setAttribute('data-id', task.id);
  if (!isDraggable) card.classList.add('opacity-75');

  card.innerHTML = `
    <div class="flex items-start justify-between mb-xs">
      <span class="bg-primary-fixed text-on-primary-fixed-variant px-2 py-0.5 rounded-full font-label-sm text-label-sm">${category}</span>
      <div class="flex items-center gap-xs">
        ${starred ? `<span class="material-symbols-outlined text-primary text-sm" style="font-variation-settings: 'FILL' 1">star</span>` : ''}
        <span class="material-symbols-outlined text-${task.status === 'done' ? 'tertiary-container' : 'outline'} text-sm" ${task.status === 'done' ? "style=\"font-variation-settings: 'FILL' 1\"" : ''}>${task.status === 'done' ? 'check_circle' : 'attach_file'}</span>
      </div>
    </div>
    <h4 class="font-label-md text-label-md text-on-surface mb-xs ${task.status === 'done' ? 'line-through' : ''}">${task.title}</h4>
    <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">${task.description}</p>
    <div class="mt-md flex items-center justify-between">
      <div class="flex items-center gap-xs">
        <img class="w-6 h-6 rounded-full border-2 border-surface object-cover" src="${userAvatars[task.userId] || defaultAvatar}" alt="${name}" title="Assigned to: ${name}"/>
        <span class="text-xs text-on-surface-variant font-medium hidden md:inline truncate max-w-[100px]">${name.split(' ')[0]}</span>
      </div>
      <span class="font-label-sm text-label-sm ${time === 'Today' ? 'text-primary font-bold' : 'text-outline'} flex items-center gap-1">
        <span class="material-symbols-outlined text-sm">${task.status === 'done' ? 'check' : 'schedule'}</span>${time}
      </span>
    </div>
  `;
  card.addEventListener('click', () => !card.classList.contains('dragging') && openTaskModal(task));
  return card;
}

// --- DRAG AND DROP ---
function initDragAndDrop() {
  document.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      const t = state.tasks.find(x => String(x.id) === String(card.getAttribute('data-id')));
      if (!t || (state.currentUser.role === 'coder' && String(t.userId) !== String(state.currentUser.id))) {
        e.preventDefault();
        if (t) showToast("Access Denied: You cannot drag tasks assigned to others!", "error");
        return;
      }
      card.classList.add('dragging', 'opacity-50');
      e.dataTransfer.setData('text/plain', t.id);
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging', 'opacity-50'));
  });

  document.querySelectorAll('.task-list-zone').forEach(list => {
    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      list.classList.add('bg-surface-container/60', 'border-2', 'border-dashed', 'border-primary/30');
    });
    list.addEventListener('dragleave', () => list.classList.remove('bg-surface-container/60', 'border-2', 'border-dashed', 'border-primary/30'));
    list.addEventListener('drop', async (e) => {
      e.preventDefault();
      list.classList.remove('bg-surface-container/60', 'border-2', 'border-dashed', 'border-primary/30');
      const taskId = e.dataTransfer.getData('text/plain');
      const t = state.tasks.find(x => String(x.id) === String(taskId));
      if (!t) return;
      const status = list.getAttribute('data-status');
      if (state.currentUser.role === 'coder' && String(t.userId) !== String(state.currentUser.id)) {
        showToast("Access Denied: You cannot move tasks assigned to others!", "error");
        return;
      }
      if (t.status !== status) {
        await updateTask(t.id, { status }, true);
        renderKanbanBoard();
      }
    });
  });
}

// --- MODALS HELPER ---
function toggleModal(modalId, show) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  const inner = modal.querySelector('.transform');
  if (show) {
    modal.classList.remove('hidden', 'pointer-events-none');
    setTimeout(() => {
      modal.classList.add('opacity-100');
      if (inner) inner.classList.replace('scale-95', 'scale-100');
    }, 10);
  } else {
    modal.classList.remove('opacity-100');
    if (inner) inner.classList.replace('scale-100', 'scale-95');
    setTimeout(() => modal.classList.add('hidden', 'pointer-events-none'), 200);
  }
}

// --- TASK MODAL ---
function openTaskModal(task = null) {
  const form = document.getElementById('taskForm');
  const titleText = document.getElementById('modalTitleText');
  const title = document.getElementById('taskTitle');
  const desc = document.getElementById('taskDesc');
  const status = document.getElementById('taskStatus');
  const assignee = document.getElementById('taskAssignee');
  const starred = document.getElementById('taskStarred');
  const taskId = document.getElementById('modalTaskId');

  form.reset();
  taskId.value = '';
  [title, desc, status, assignee, starred].forEach(i => i.removeAttribute('disabled'));

  if (task) {
    titleText.textContent = "Edit Task Details";
    taskId.value = task.id;
    title.value = task.title;
    desc.value = task.description;
    status.value = task.status;
    assignee.value = task.userId;
    starred.checked = !!task.starred;

    if (state.currentUser.role === 'coder') {
      const mine = String(task.userId) === String(state.currentUser.id);
      [title, assignee, starred].forEach(i => i.setAttribute('disabled', 'true'));
      if (!mine) {
        [desc, status].forEach(i => i.setAttribute('disabled', 'true'));
        showToast("ReadOnly Mode: This task is assigned to another team member.", "info");
      }
    }
  } else {
    if (state.currentUser.role !== 'admin') {
      showToast("Access Denied: Only Admins can create tasks.", "error");
      return;
    }
    titleText.textContent = "Create New Task";
    status.value = "todo";
  }

  const deleteBtn = document.getElementById('deleteTaskBtn');
  if (deleteBtn) {
    if (task && state.currentUser.role === 'admin') {
      deleteBtn.classList.remove('hidden');
    } else {
      deleteBtn.classList.add('hidden');
    }
  }

  toggleModal('taskModalOverlay', true);
}

async function handleTaskFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('modalTaskId').value;
  const data = {
    title: document.getElementById('taskTitle').value.trim(),
    description: document.getElementById('taskDesc').value.trim(),
    status: document.getElementById('taskStatus').value,
    userId: document.getElementById('taskAssignee').value,
    starred: document.getElementById('taskStarred').checked
  };

  if (id) {
    const t = state.tasks.find(x => String(x.id) === String(id));
    if (!t) return;
    if (state.currentUser.role === 'coder') {
      if (String(t.userId) !== String(state.currentUser.id)) return;
      await updateTask(t.id, { description: data.description, status: data.status });
    } else {
      await updateTask(t.id, data);
    }
  } else {
    await createTask(data);
  }
  toggleModal('taskModalOverlay', false);
  renderKanbanBoard();
}

// --- USER MODAL & CRUD ---
function openUserModal(user = null) {
  const form = document.getElementById('userForm');
  const title = document.getElementById('userModalTitleText');
  const name = document.getElementById('userName');
  const email = document.getElementById('userEmail');
  const pass = document.getElementById('userPassword');
  const role = document.getElementById('userRole');
  const idInput = document.getElementById('modalUserId');

  form.reset();
  idInput.value = '';
  role.removeAttribute('disabled');

  if (user) {
    title.textContent = "Edit Member Details";
    idInput.value = user.id;
    name.value = user.name;
    email.value = user.email;
    pass.value = user.password;
    role.value = user.role;
    if (String(user.id) === String(state.currentUser.id)) role.setAttribute('disabled', 'true');
  } else {
    title.textContent = "Add New Member";
    role.value = "coder";
  }
  toggleModal('userModalOverlay', true);
}

async function handleUserFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('modalUserId').value;
  const name = document.getElementById('userName').value.trim();
  const email = document.getElementById('userEmail').value.trim();
  const password = document.getElementById('userPassword').value;
  const role = document.getElementById('userRole').value;

  if (state.users.some(u => u.email.toLowerCase() === email.toLowerCase() && String(u.id) !== String(id))) {
    showToast("Error: This email address is already registered.", "error");
    return;
  }

  if (id) {
    const existing = state.users.find(u => String(u.id) === String(id));
    if (!existing) return;
    const data = { name, email, password };
    if (String(existing.id) !== String(state.currentUser.id)) data.role = role;

    await updateUser(existing.id, data);
    if (String(existing.id) === String(state.currentUser.id)) {
      state.currentUser = { ...state.currentUser, ...data };
      localStorage.setItem('riwiflow_user', JSON.stringify(state.currentUser));
    }
  } else {
    await createUser({ name, email, password, role });
  }
  toggleModal('userModalOverlay', false);
  renderTeamView();
}

async function handleUserDelete(userId) {
  const u = state.users.find(x => String(x.id) === String(userId));
  if (!u) return;
  if (String(u.id) === String(state.currentUser.id)) {
    showToast("Access Denied: You cannot delete your own account!", "error");
    return;
  }

  const assignedTasks = state.tasks.filter(t => String(t.userId) === String(userId));

  if (assignedTasks.length > 0) {
    if (confirm(`Warning: ${u.name} has ${assignedTasks.length} active task(s) assigned. Deleting this member will also permanently delete all of their assigned tasks. Are you sure you want to proceed?`)) {
      await Promise.all(assignedTasks.map(t => apiRequest(`/tasks/${t.id}`, 'DELETE', null, "Failed to delete task.")));
      await fetchTasks();
      await deleteUser(u.id);
      renderTeamView();
    }
  } else {
    if (confirm(`Are you sure you want to permanently delete ${u.name} from the workspace?`)) {
      await deleteUser(u.id);
      renderTeamView();
    }
  }
}

function renderTeamView() {
  const boardCol = document.getElementById('boardColumnsContainer');
  if (!boardCol) return;

  boardCol.innerHTML = `
    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row md:items-center justify-between pb-md border-b border-outline-variant mb-xl gap-md">
        <div>
          <h2 class="font-headline-md text-headline-md font-bold text-primary">Team Members</h2>
          <p class="font-body-md text-body-md text-on-surface-variant">Manage your workspace members and their roles.</p>
        </div>
        <button id="addMemberBtn" class="bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md py-md px-lg rounded-lg transition-all active:scale-[0.98] duration-150 flex items-center gap-sm shadow-sm shrink-0">
          <span class="material-symbols-outlined text-[18px]">person_add</span>Add Member
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter" id="teamMembersGrid"></div>
    </div>
  `;

  const grid = document.getElementById('teamMembersGrid');
  state.users.forEach(u => {
    const card = document.createElement('div');
    card.className = "bg-surface border border-outline-variant rounded-xl p-md shadow-sm relative flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-200 animate-fade-in";
    card.innerHTML = `
      <div class="flex items-start gap-md">
        <img src="${userAvatars[u.id] || defaultAvatar}" alt="${u.name}" class="w-12 h-12 rounded-full object-cover border border-outline-variant shrink-0" />
        <div class="min-w-0 flex-1">
          <h4 class="font-label-md text-label-md text-on-surface truncate font-semibold">${u.name}</h4>
          <p class="font-body-sm text-body-sm text-on-surface-variant truncate">${u.email}</p>
          <div class="mt-xs">
            <span class="inline-block px-2.5 py-0.5 rounded-full font-label-sm text-[11px] capitalize ${u.role === 'admin' ? 'bg-primary-container text-on-primary font-medium' : 'bg-secondary-container text-on-secondary font-medium'}">${u.role}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-end gap-sm mt-md pt-sm border-t border-outline-variant">
        <button class="edit-member-btn text-primary hover:bg-primary-container/10 p-1.5 rounded-lg transition-all flex items-center justify-center" data-id="${u.id}"><span class="material-symbols-outlined text-[18px]">edit</span></button>
        ${String(u.id) !== String(state.currentUser.id) ? `<button class="delete-member-btn text-error hover:bg-error-container/10 p-1.5 rounded-lg transition-all flex items-center justify-center" data-id="${u.id}"><span class="material-symbols-outlined text-[18px]">delete</span></button>` : ''}
      </div>
    `;
    card.querySelector('.edit-member-btn').addEventListener('click', () => openUserModal(u));
    const del = card.querySelector('.delete-member-btn');
    if (del) del.addEventListener('click', () => handleUserDelete(u.id));
    grid.appendChild(card);
  });

  const add = document.getElementById('addMemberBtn');
  if (add) add.addEventListener('click', () => openUserModal(null));
}

// --- EVENTS ---
function bindDashboardEvents() {
  const logout = document.getElementById('logoutBtn');
  if (logout) logout.addEventListener('click', () => {
    localStorage.removeItem('riwiflow_user');
    state.currentUser = null;
    showToast("Logged out successfully.", "info");
    window.location.hash = '#/login';
  });

  const create = document.getElementById('sidebarCreateBtn');
  if (create) create.addEventListener('click', () => openTaskModal(null));

  const taskForm = document.getElementById('taskForm');
  if (taskForm) taskForm.addEventListener('submit', handleTaskFormSubmit);

  const cancelModal = document.getElementById('cancelModalBtn');
  const closeModal = document.getElementById('closeModalBtn');
  if (cancelModal) cancelModal.addEventListener('click', () => toggleModal('taskModalOverlay', false));
  if (closeModal) closeModal.addEventListener('click', () => toggleModal('taskModalOverlay', false));

  const deleteBtn = document.getElementById('deleteTaskBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      const id = document.getElementById('modalTaskId').value;
      if (!id) return;
      if (confirm("Are you sure you want to permanently delete this task?")) {
        await deleteTask(id);
        toggleModal('taskModalOverlay', false);
        renderKanbanBoard();
      }
    });
  }

  const userForm = document.getElementById('userForm');
  if (userForm) userForm.addEventListener('submit', handleUserFormSubmit);

  const cancelUser = document.getElementById('cancelUserModalBtn');
  const closeUser = document.getElementById('closeUserModalBtn');
  if (cancelUser) cancelUser.addEventListener('click', () => toggleModal('userModalOverlay', false));
  if (closeUser) closeUser.addEventListener('click', () => toggleModal('userModalOverlay', false));
}

// --- TOASTS ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  let bg = "bg-primary text-on-primary", icon = "check_circle";
  if (type === 'error') { bg = "bg-error text-on-error"; icon = "report"; }
  else if (type === 'info') { bg = "bg-secondary-container text-on-secondary-container"; icon = "info"; }

  toast.className = `toast-animate flex items-center gap-md px-md py-3 rounded-xl border border-outline-variant shadow-lg pointer-events-auto ${bg}`;
  toast.innerHTML = `<span class="material-symbols-outlined text-[20px]">${icon}</span><span class="font-label-md text-label-md">${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "all 0.3s ease-out";
    toast.style.transform = "translateY(50px)";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
