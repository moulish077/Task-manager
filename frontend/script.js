const API = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

if (!token) {
  alert('⚠️ No token found. Setting test token...');
  localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3R1c2VyMTIzIiwiaWF0IjoxNzc4NjAxOTI3LCJleHAiOjE3NzkyMDY3Mjd9.N3_hWLPP0B7y848ClJilJ2uufoO1wCkO9n8H5rArlkE');
}

// ── LOAD TASKS ──
async function loadTasks(filter = '') {
  try {
    const res = await fetch(`${API}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load tasks');
    const tasks = await res.json();
    render(tasks, filter);
  } catch (err) {
    console.error('Error loading tasks:', err);
    flash('❌ Failed to load tasks');
  }
}

// ── RENDER BOARD ──
function render(tasks, filter = '') {
  const cols = ['todo', 'inprogress', 'review', 'done'];

  cols.forEach(s => {
    const col = document.getElementById('col-' + s);
    col.querySelectorAll('.task-card, .add-task-btn').forEach(el => el.remove());

    const filtered = tasks.filter(t =>
      t.status === s && t.title.toLowerCase().includes(filter.toLowerCase())
    );

    document.getElementById('cnt-' + s).textContent =
      tasks.filter(t => t.status === s).length;

    filtered.forEach(t => {
      const card = document.createElement('div');
      card.className = 'task-card';
      card.innerHTML = `
        <div class="card-actions">
          <button onclick="editTask('${t._id}')">✏️</button>
          <button onclick="deleteTask('${t._id}')">🗑️</button>
        </div>
        <div class="task-title">${t.title}</div>
        <div class="task-meta">
          <span class="tag tag-${t.priority}">${t.priority}</span>
          <span class="tag tag-${t.type}">${t.type}</span>
          <div class="task-assign">MK</div>
        </div>`;
      col.appendChild(card);
    });

    const addBtn = document.createElement('div');
    addBtn.className = 'add-task-btn';
    addBtn.textContent = '+ Add task';
    addBtn.onclick = () => {
      document.getElementById('f-status').value = s;
      openModal();
    };
    col.appendChild(addBtn);
  });

  document.getElementById('total-badge').textContent = tasks.length;
}

// ── MODAL FUNCTIONS ──
let editingId = null;

function openModal(reset = true) {
  if (reset) {
    editingId = null;
    document.getElementById('modal-title').textContent = 'New Task';
    document.getElementById('f-title').value = '';
    document.getElementById('f-priority').value = 'mid';
    document.getElementById('f-type').value = 'feat';
    document.getElementById('f-status').value = 'todo';
  }
  document.getElementById('modal-bg').classList.add('open');
  document.getElementById('f-title').focus();
}

function closeModal() {
  document.getElementById('modal-bg').classList.remove('open');
  editingId = null;
}

// ── SAVE TASK ──
async function saveTask() {
  const title = document.getElementById('f-title').value.trim();
  if (!title) {
    document.getElementById('f-title').style.borderColor = 'red';
    return;
  }
  document.getElementById('f-title').style.borderColor = '#ddd';

  const data = {
    title,
    priority: document.getElementById('f-priority').value,
    type: document.getElementById('f-type').value,
    status: document.getElementById('f-status').value,
  };

  try {
    if (editingId) {
      const res = await fetch(`${API}/tasks/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update');
      flash('✅ Task updated');
    } else {
      const res = await fetch(`${API}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create');
      flash('✅ Task created');
    }
    closeModal();
    loadTasks(document.getElementById('search-input').value);
  } catch (err) {
    console.error('Error saving task:', err);
    flash('❌ ' + err.message);
  }
}

// ── EDIT TASK ──
async function editTask(id) {
  try {
    const res = await fetch(`${API}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load');
    const tasks = await res.json();
    const t = tasks.find(t => t._id === id);

    if (t) {
      editingId = id;
      document.getElementById('modal-title').textContent = 'Edit Task';
      document.getElementById('f-title').value = t.title;
      document.getElementById('f-priority').value = t.priority;
      document.getElementById('f-type').value = t.type;
      document.getElementById('f-status').value = t.status;
      openModal(false);
    }
  } catch (err) {
    console.error('Error editing task:', err);
    flash('❌ Failed to load task');
  }
}

// ── DELETE TASK ──
async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    const res = await fetch(`${API}/tasks/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete');
    flash('🗑️ Task deleted');
    loadTasks(document.getElementById('search-input').value);
  } catch (err) {
    console.error('Error deleting task:', err);
    flash('❌ Failed to delete');
  }
}

// ── FLASH MESSAGE ──
function flash(msg) {
  const el = document.querySelector('.status-bar');
  el.textContent = msg + ' — ' + new Date().toLocaleTimeString();
  setTimeout(() => { el.textContent = '🟢 All changes saved'; }, 3000);
}

// ── SEARCH ──
document.getElementById('search-input').addEventListener('input', e => {
  const boardView = document.querySelector('.board').style.display;
  if (boardView !== 'none') {
    loadTasks(e.target.value);
  }
});

// ── CLOSE MODAL ON BACKGROUND CLICK ──
document.getElementById('modal-bg').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-bg')) closeModal();
});

// ──  PAGE NAVIGATION ──
function showPage(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Show selected page
  if (page === 'board') {
    document.querySelector('.board').style.display = 'flex';
    document.querySelector('.topbar').style.display = 'flex';
    document.querySelector('.status-bar').style.display = 'block';
    loadTasks();
  } else {
    document.querySelector('.board').style.display = 'none';
    document.querySelector('.topbar').style.display = 'none';
    document.querySelector('.status-bar').style.display = 'none';
    document.getElementById('page-' + page).classList.add('active');

    if (page === 'backlog') loadBacklog();
    if (page === 'analytics') loadAnalytics();
  }

  document.getElementById('nav-' + page).classList.add('active');
}

// ── BACKLOG PAGE ──
async function loadBacklog() {
  try {
    const res = await fetch(`${API}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load');
    const tasks = await res.json();
    const tbody = document.getElementById('backlog-body');
    tbody.innerHTML = '';

    if (tasks.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888;">No tasks yet. Create one to get started!</td></tr>';
      return;
    }

    tasks.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.title}</td>
        <td><span class="tag tag-${t.priority}">${t.priority}</span></td>
        <td><span class="tag tag-${t.type}">${t.type}</span></td>
        <td>${t.status.toUpperCase()}</td>
        <td>
          <button onclick="editTask('${t._id}')">✏️ Edit</button>
          <button onclick="deleteTask('${t._id}')">🗑️ Delete</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading backlog:', err);
    flash('❌ Failed to load backlog');
  }
}

// ── ANALYTICS PAGE ──
async function loadAnalytics() {
  try {
    const res = await fetch(`${API}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load');
    const tasks = await res.json();

    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const completed = total > 0 ? Math.round((done / total) * 100) : 0;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-todo').textContent = tasks.filter(t => t.status === 'todo').length;
    document.getElementById('stat-inprogress').textContent = tasks.filter(t => t.status === 'inprogress').length;
    document.getElementById('stat-review').textContent = tasks.filter(t => t.status === 'review').length;
    document.getElementById('stat-done').textContent = done;
    document.getElementById('stat-high').textContent = tasks.filter(t => t.priority === 'high').length;
    document.getElementById('stat-bugs').textContent = tasks.filter(t => t.type === 'bug').length;
    document.getElementById('stat-features').textContent = tasks.filter(t => t.type === 'feat').length;
    document.getElementById('stat-completed').textContent = completed + '%';
  } catch (err) {
    console.error('Error loading analytics:', err);
    flash('❌ Failed to load analytics');
  }
}

// ── SETTINGS PAGE ──
function saveSettings() {
  const name = document.getElementById('set-name').value || 'Moulish T';
  const role = document.getElementById('set-role').value || 'Developer';

  document.querySelector('.user-name').textContent = name;
  document.querySelector('.user-role').textContent = role;
  document.querySelector('.sidebar-footer .avatar').textContent =
    name.split(' ').map(w => w[0]).join('').toUpperCase();

  localStorage.setItem('userName', name);
  localStorage.setItem('userRole', role);

  flash('💾 Settings saved!');
  setTimeout(() => showPage('board'), 1000);
}

async function clearAllTasks() {
  if (!confirm('⚠️ Are you sure? Delete ALL tasks permanently? This cannot be undone.')) return;

  try {
    const res = await fetch(`${API}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load');
    const tasks = await res.json();

    for (let t of tasks) {
      await fetch(`${API}/tasks/${t._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    flash('🗑️ All tasks deleted!');
    setTimeout(() => showPage('board'), 1000);
  } catch (err) {
    console.error('Error clearing tasks:', err);
    flash('❌ Failed to delete tasks');
  }
}

// ── LOAD SAVED SETTINGS ──
function loadSavedSettings() {
  const savedName = localStorage.getItem('userName');
  const savedRole = localStorage.getItem('userRole');

  if (savedName) document.querySelector('.user-name').textContent = savedName;
  if (savedRole) document.querySelector('.user-role').textContent = savedRole;
  if (savedName) document.getElementById('set-name').value = savedName;
  if (savedRole) document.getElementById('set-role').value = savedRole;
}

// ── MAKE FUNCTIONS GLOBAL ──
window.openModal = openModal;
window.closeModal = closeModal;
window.saveTask = saveTask;
window.editTask = editTask;
window.deleteTask = deleteTask;
window.showPage = showPage;
window.loadBacklog = loadBacklog;
window.loadAnalytics = loadAnalytics;
window.saveSettings = saveSettings;
window.clearAllTasks = clearAllTasks;
window.flash = flash;

// ── INIT ──
loadSavedSettings();
loadTasks();