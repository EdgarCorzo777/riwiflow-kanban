# Riwiflow - SPA Kanban Board with Role-Based Access Control (RBAC)

Welcome to **Riwiflow**, a lightweight, high-fidelity Single Page Application (SPA) built using modern Vanilla JavaScript, CSS, and HTML5. The project replicates the exact visual design of the original prototypes while incorporating dynamic hash-based routing, REST API communication with JSON-Server, and custom drag-and-drop mechanics protected by user roles.

---

## 🛠️ Prerequisites

The only requirement is having **Node.js** installed on your system (which includes `npm` and `npx` automatically).

- ❌ No need to install the **Live Server** VS Code extension.
- ❌ No need to run `npm install` beforehand.
- ❌ No need to use VS Code specifically (any terminal works).

---

## 🚀 Running the Project

1. **Open a terminal** in the root directory of the project.
2. **Run the following command:**
   ```bash
   npm run start
   ```
   This single command automatically:
   - Downloads and launches **JSON-Server** on `http://localhost:3000` (the REST API / database).
   - Downloads and launches **Live Server** on `http://localhost:5500` (the frontend).
   - Runs both servers **concurrently** in the same terminal window.

3. **Open your browser** and navigate to:
   ```url
   http://localhost:5500
   ```

---

## 🔐 Credentials (Demo Users)

You can log in manually using the following credentials:

| Name | Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Edgar Corzo** | `admin` | `admin@riwiflow.com` | `admin123` | Can create/edit/drag/delete tasks, and perform full CRUD on Team Members. |
| **Tung Tung** | `coder` | `tung@riwiflow.com` | `dev123` | Can only edit and drag tasks *assigned to him/her*. Read-only for others. |
| **John Pork** | `coder` | `john@riwiflow.com` | `dev123` | Can only edit and drag tasks *assigned to him/her*. Read-only for others. |

---

## 📋 Features & How to Test Them

### 1. SPA Navigation (HU-02)
- Notice that logging in, logging out, opening modals, or modifying tasks updates the user interface instantly **without reloading the browser page**.
- The URL will smoothly transition between routes (`#/login`, `#/dashboard`, `#/team`) while utilizing route guard protection to prevent unauthenticated access.

### 2. Admin Tasks Operations (HU-03 & HU-05)
- **Create Tasks (HU-03):** Log in as **Edgar Corzo (Admin)**. Click the purple **"+ New Task"** button on the sidebar. Fill out the details, assign it to a coder, and click "Save". The task will appear immediately in the **"To Do"** column.
- **Full Task Editing & Deletion (HU-05):** Click any task card. As an Admin, you can edit all inputs (Title, Description, Status, Assignee, Star priority). You can also click the red **"Delete Task"** button on the bottom left of the modal to permanently delete the task from the database.

### 3. Team / Coder CRUD Management (New Feature)
- Log in as **Edgar Corzo (Admin)**.
- Navigate to the **"Team"** view by clicking the Team option in the sidebar navigation.
- **Create Members:** Click **"Add Member"**, fill in the Full Name, Email, Password, and select their role (`coder` or `admin`). Saving will add them to the database immediately.
- **Update Members:** Click the edit icon on any member card to update their details (Admins cannot change their own role to prevent lockout).
- **Delete Members:** Click the delete icon on a member card to remove them (Admins cannot delete their own account).

### 4. Coder Operations (HU-06)
- Log in as **Tung Tung (Coder)**.
- **Disabled Creation:** Note that the "+ New Task" button on the sidebar is completely hidden.
- **Access Restrictions:** 
  - Try to open a task assigned to *John Pork* (e.g. "Social Media Assets"). A toast alert will notify you it is in **ReadOnly mode**. All form fields will be disabled, and the "Save" button will be hidden.
  - Try to open a task assigned to *Tung Tung* (e.g. "API Documentation"). You will be allowed to modify the **Description** and the **Status**, but the *Title* and *Assignee* fields will be locked to prevent unauthorized tampering.
  - Notice that the **"Team"** management view is restricted. If you manually navigate to `#/team`, the route guard will automatically redirect you back to `#/dashboard`.

### 5. Kanban Drag & Drop Flow (HU-07 & HU-01)
- **Admin Permissions:** Drag any task between columns (To Do, In Progress, In Review, Done). Visual count badges will update dynamically.
- **Coder Restrictions:** As a Coder (e.g. Tung Tung), try to drag a task assigned to another user. The drag event will be blocked, and a red warning toast will show: *"Access Denied: You cannot drag tasks assigned to others!"*. Dragging your own task is allowed and updates the JSON-Server in real-time.

---

## 🗄️ Database Schema (db/db.json)

The server utilizes `json-server` to serve mock endpoints matching the requested format from the `db/` directory:
- `/users`: Array of user accounts.
- `/tasks`: Array of tasks linked to coders via `userId`.
- Status fields correspond exactly to: `todo`, `in progress`, `in review`, and `done`.

---

## 👥 Authors

- **Edgar Corzo**
- **Janner de la hoz**
