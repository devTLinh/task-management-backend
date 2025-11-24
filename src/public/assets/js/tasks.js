// Tasks module: CRUD, history, comments, files (localStorage-backed)
(function(){
  'use strict';

  const ready = (fn)=> document.readyState==='loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();

  const TASKS_KEY = 'tm.tasks';
  const HISTORY_KEY = 'tm.taskHistory';
  const COMMENTS_KEY = 'tm.comments';
  const FILES_KEY = 'tm.files';

  const getUser = () => ({ name: (localStorage.getItem('tm.userName') || 'User').trim(), email: (localStorage.getItem('tm.email') || '').trim() });
  const el = (sel) => document.querySelector(sel);
  const nowIso = () => new Date().toISOString();
  const escapeHtml = (s='') => s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]||c));
  const prRank = (p)=> ({ High:3, Medium:2, Low:1 }[p] || 0);
  let tableSort = { by: 'priority', dir: 'desc' };
  const getProjectName = (id) => {
    try {
      const arr = JSON.parse(localStorage.getItem('tm.projects') || '[]');
      const p = arr.find(x => x.id === id);
      return (p && p.name) ? p.name : '';
    } catch { return ''; }
  };

  const load = (key) => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
  const save = (key, list) => localStorage.setItem(key, JSON.stringify(list));
  const getRole = () => (localStorage.getItem('tm.role') || 'Member');
  const roleRank = { Member:1, Leader:2, Admin:3 };
  const hasRole = (min) => (roleRank[getRole()]||1) >= (roleRank[min]||1);

  const seedIfEmpty = () => {
    const tasks = load(TASKS_KEY);
    if (tasks.length) return;
    const projects = load('tm.projects');
    const projectId = projects[0]?.id || 'demo';
    const demo = [
      { id: crypto.randomUUID(), projectId, title: 'Design landing page', description: 'Hero + features', dueDate: '2025-11-20', assignedTo: 'Mai Anh', priority: 'High', status: 'InProgress', createdAt: nowIso(), updatedAt: nowIso() },
      { id: crypto.randomUUID(), projectId, title: 'Write onboarding docs', description: '', dueDate: '2025-11-25', assignedTo: 'Long', priority: 'Medium', status: 'Todo', createdAt: nowIso(), updatedAt: nowIso() },
      { id: crypto.randomUUID(), projectId, title: 'Implement analytics event', description: '', dueDate: '2025-11-18', assignedTo: 'Ha', priority: 'Low', status: 'Done', createdAt: nowIso(), updatedAt: nowIso() },
    ];
    save(TASKS_KEY, demo);
  };

  const statusClass = (s) => ({
    'Todo':'status--todo',
    'InProgress':'status--inprogress',
    'Review':'status--review',
    'Done':'status--done',
  }[s] || 'status--todo');

  const renderProjectsSelect = (selectEl) => {
    const projects = load('tm.projects');
    selectEl.innerHTML = projects.map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('');
  };

  const renderAssigneesSelect = (projectId, selectedName='') => {
    const sel = el('#taskAssignee');
    if (!sel) return;
    let names = [];
    try {
      const projects = load('tm.projects');
      const p = projects.find(x => x.id === projectId);
      names = (p && Array.isArray(p.members)) ? p.members.map(m => (m && m.name ? String(m.name).trim() : '')).filter(Boolean) : [];
    } catch {}
    const uniq = Array.from(new Set(names));
    // If editing a task whose assignee is not in members anymore, keep it selectable
    if (selectedName && !uniq.includes(selectedName)) uniq.unshift(selectedName);
    const opts = ['<option value="">Unassigned</option>'].concat(uniq.map(n => `<option value="${escapeHtml(n)}" ${selectedName===n?'selected':''}>${escapeHtml(n)}</option>`));
    sel.innerHTML = opts.join('');
  };

  const renderTable = () => {
    const q = el('#taskSearch').value.trim().toLowerCase();
    const st = el('#taskStatus').value;
    const pr = el('#taskPriority').value;
    const tbody = el('#taskTbody');
    const tasks = load(TASKS_KEY)
      .filter(t => (st==='all'||t.status===st) && (pr==='all'||t.priority===pr) && (!q || (t.title||'').toLowerCase().includes(q) || (t.assignedTo||'').toLowerCase().includes(q)))
      .sort((a,b)=>{
        if (tableSort.by === 'priority') {
          const cmp = prRank(a.priority) - prRank(b.priority);
          return tableSort.dir === 'asc' ? cmp : -cmp;
        }
        return 0;
      });
    tbody.innerHTML = tasks.map(t=>{
      const cls = statusClass(t.status);
      const tagClass = t.priority==='High' ? 'tag tag--warn' : (t.priority==='Low' ? 'tag tag--ok' : 'tag');
      const projName = escapeHtml(getProjectName(t.projectId) || '-');
      return `<tr data-id="${t.id}">
        <td>${escapeHtml(t.title)}</td>
        <td>${projName}</td>
        <td>${escapeHtml(t.assignedTo||'')}</td>
        <td>${escapeHtml(t.dueDate||'')}</td>
        <td><span class="${tagClass}">${escapeHtml(t.priority||'')}</span></td>
        <td><span class="status ${cls}">${escapeHtml(t.status.replace(/([A-Z])/g,' $1').trim())}</span></td>
      </tr>`;
    }).join('');
    tbody.querySelectorAll('tr').forEach(tr => tr.addEventListener('click', ()=> openEdit(tr.dataset.id)));
  };

  const renderBoard = () => {
    const q = el('#taskSearch').value.trim().toLowerCase();
    const st = el('#taskStatus').value;
    const pr = el('#taskPriority').value;
    const tasks = load(TASKS_KEY)
      .filter(t => (st==='all'||t.status===st) && (pr==='all'||t.priority===pr) && (!q || (t.title||'').toLowerCase().includes(q) || (t.assignedTo||'').toLowerCase().includes(q)))
      // Within same status and same project, sort by priority (High > Medium > Low).
      // Otherwise, keep previous manual order per status.
      .sort((a,b)=>{
        if (a.status === b.status) {
          if ((a.projectId||'') === (b.projectId||'')) {
            const cmpPr = prRank(b.priority) - prRank(a.priority);
            if (cmpPr !== 0) return cmpPr;
          }
          return (a.order ?? 0) - (b.order ?? 0);
        }
        return 0;
      });
    const cols = { 'Todo':'col-todo','InProgress':'col-inprogress','Review':'col-review','Done':'col-done' };
    Object.values(cols).forEach(id => { const c = el('#'+id); if (c) c.innerHTML = ''; });
    tasks.forEach(t=>{
      const card = document.createElement('div'); card.className='card'; card.draggable=true; card.dataset.id=t.id; card.dataset.project = t.projectId || '';
      const projName = escapeHtml(getProjectName(t.projectId) || '-');
      card.innerHTML = `<div class="card__title">${escapeHtml(t.title)}</div><div class="card__meta"><span class="tag"><i class="fa-regular fa-folder"></i>${projName}</span><span class="tag">${escapeHtml(t.assignedTo||'')}</span><span class="tag">${escapeHtml(t.priority||'')}</span><span class="tag">${escapeHtml(t.dueDate||'')}</span></div>`;
      const container = el('#'+cols[t.status]) || el('#col-todo'); container && container.appendChild(card);
      card.addEventListener('dblclick', ()=> openEdit(t.id));
      card.addEventListener('dragstart', (e)=> { e.dataTransfer.setData('text/plain', t.id); card.classList.add('dragging'); });
      card.addEventListener('dragend', ()=> card.classList.remove('dragging'));
    });
    // Helper to find insert position during drag
    const getDragAfterElement = (container, y, projectId) => {
      const els = [...container.querySelectorAll('.card:not(.dragging)')]
        .filter(el => (el.dataset.project || '') === (projectId || ''));
      const MARGIN = 4; // px hysteresis to avoid jitter; only compare within same project
      return els.reduce((closest, child)=>{
        const box = child.getBoundingClientRect();
        const offset = y - (box.top + box.height/2);
        if ((offset < -MARGIN) && (offset > closest.offset)) { return { offset, element: child }; }
        return closest;
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    };
    document.querySelectorAll('.board--tasks .board__list').forEach(list => {
      let raf = null; let lastY = 0;
      list.addEventListener('dragover', (e)=>{
        e.preventDefault();
        list.classList.add('drag-over');
        lastY = e.clientY;
        if (raf) return;
        raf = requestAnimationFrame(()=>{
          raf = null;
          const dragging = document.querySelector('.card.dragging');
          if (!dragging) return;
          const projId = dragging.dataset.project || '';
          const after = getDragAfterElement(list, lastY, projId);
          if (after == null) {
            const rect = list.getBoundingClientRect();
            const mid = rect.top + rect.height / 2;
            if (lastY < mid) {
              if (list.firstElementChild !== dragging) list.prepend(dragging);
            } else {
              if (list.lastElementChild !== dragging) list.appendChild(dragging);
            }
          } else if (after !== dragging.nextElementSibling || dragging.parentElement !== list) {
            list.insertBefore(dragging, after);
          }
        });
      });
      list.addEventListener('dragleave', ()=> list.classList.remove('drag-over'));
      list.addEventListener('drop', (e)=>{
        e.preventDefault(); list.classList.remove('drag-over');
        const id = e.dataTransfer.getData('text/plain'); if (!id) return;
        const statusMap = { 'col-todo':'Todo','col-inprogress':'InProgress','col-review':'Review','col-done':'Done' };
        const newStatus = statusMap[list.id]; if (!newStatus) return;
        const arr = load(TASKS_KEY); const t = arr.find(x=>x.id===id); if (!t) return;
        // Role gate: Admin/Leader can move any; Member only if assigned
        if (!hasRole('Leader')) {
          const me = (localStorage.getItem('tm.userName')||'User').trim();
          if ((t.assignedTo||'').trim() !== me) { window.showToast && showToast('You can only move your assigned tasks', 'error'); return; }
        }
        const oldStatus = t.status;
        t.status = newStatus; t.updatedAt = nowIso();
        // Ensure append if list was empty and no prior insertion occurred
        const dragging = document.querySelector('.card.dragging');
        if (dragging && dragging.parentElement !== list) list.appendChild(dragging);
        // Persist order by DOM sequence within this list
        const ids = [...list.querySelectorAll('.card')].map(x=>x.dataset.id);
        ids.forEach((tid, idx)=>{ const task = arr.find(x=>x.id===tid); if (task) task.order = idx; });
        save(TASKS_KEY, arr);
        // History logging if status changed
        if (oldStatus !== newStatus) {
          const hist = load(HISTORY_KEY); hist.push({ id: crypto.randomUUID(), taskId:id, changedBy:getUser().name, changedField:'status', oldValue:oldStatus, newValue:newStatus, changedAt: nowIso() }); save(HISTORY_KEY, hist);
          window.showToast && showToast('Status changed', 'info');
        }
        renderBoard();
      });
    });
  };

  const renderAll = () => { renderTable(); renderBoard(); };

  const switchTab = (tab) => {
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('tab--active', b.dataset.tab === tab));
    document.querySelectorAll('.tabpane').forEach(p => p.classList.toggle('tabpane--active', p.dataset.pane === tab));
  };

  const showModal = () => el('#taskModal').classList.add('show');
  const hideModal = () => el('#taskModal').classList.remove('show');
  const resetForm = () => {
    el('#taskId').value = '';
    renderProjectsSelect(el('#taskProject'));
    renderAssigneesSelect(el('#taskProject').value, '');
    el('#taskTitle').value = '';
    el('#taskDesc').value = '';
    el('#taskDue').value = '';
    el('#taskAssignee').value = '';
    el('#taskPrioritySelect').value = 'Medium';
    el('#taskStatusSelect').value = 'Todo';
    el('#commentList').innerHTML = '';
    el('#fileList').innerHTML = '';
    el('#historyTable tbody').innerHTML = '';
  };

  const loadComments = (taskId) => {
    const list = load(COMMENTS_KEY).filter(c => c.taskId === taskId).sort((a,b)=> new Date(a.createdAt)-new Date(b.createdAt));
    const ul = el('#commentList');
    ul.innerHTML = list.map(c=>`<li class="comment" data-id="${c.id}"><div><div class="comment__meta">${escapeHtml(c.author)} • ${new Date(c.createdAt).toLocaleString()}</div><div class="comment__text">${escapeHtml(c.text)}</div></div><div class="comment__actions">${(c.author===getUser().name)?'<button data-del>Delete</button>':''}</div></li>`).join('');
    ul.querySelectorAll('button[data-del]').forEach(btn => btn.addEventListener('click', ()=>{
      const id = btn.closest('.comment').dataset.id; const all = load(COMMENTS_KEY).filter(x=>x.id!==id); save(COMMENTS_KEY, all); loadComments(taskId);
    }));
  };

  const loadFiles = (taskId) => {
    const list = load(FILES_KEY).filter(f => f.taskId === taskId).sort((a,b)=> new Date(b.uploadedAt)-new Date(a.uploadedAt));
    const ul = el('#fileList');
    ul.innerHTML = list.map(f=>`<li class="files__item" data-id="${f.id}"><div><a href="${f.dataUrl}" download="${escapeHtml(f.fileName)}">${escapeHtml(f.fileName)}</a><div class="subtle">${escapeHtml(f.uploadedBy)} • ${new Date(f.uploadedAt).toLocaleString()}</div></div><div class="files__actions">${(f.uploadedBy===getUser().name)?'<button data-del>Delete</button>':''}</div></li>`).join('');
    ul.querySelectorAll('button[data-del]').forEach(btn => btn.addEventListener('click', ()=>{
      const id = btn.closest('.files__item').dataset.id; const all = load(FILES_KEY).filter(x=>x.id!==id); save(FILES_KEY, all); loadFiles(taskId);
    }));
  };

  const loadHistory = (taskId) => {
    const list = load(HISTORY_KEY).filter(h => h.taskId === taskId).sort((a,b)=> new Date(b.changedAt)-new Date(a.changedAt));
    const tbody = el('#historyTable tbody');
    tbody.innerHTML = list.map(h=>`<tr><td>${new Date(h.changedAt).toLocaleString()}</td><td>${escapeHtml(h.changedBy)}</td><td>${escapeHtml(h.field)}</td><td>${escapeHtml(String(h.oldValue||''))}</td><td>${escapeHtml(String(h.newValue||''))}</td></tr>`).join('');
  };

  const openEdit = (id) => {
    const tasks = load(TASKS_KEY);
    const t = tasks.find(x=>x.id===id);
    el('#taskModalTitle').textContent = t ? 'Edit task' : 'New task';
    switchTab('task-info');
    resetForm();
    if (t) {
      el('#taskId').value = t.id;
      renderProjectsSelect(el('#taskProject'));
      el('#taskProject').value = t.projectId || '';
      renderAssigneesSelect(el('#taskProject').value, t.assignedTo||'');
      el('#taskTitle').value = t.title || '';
      el('#taskDesc').value = t.description || '';
      el('#taskDue').value = t.dueDate || '';
      el('#taskAssignee').value = t.assignedTo || '';
      el('#taskPrioritySelect').value = t.priority || 'Medium';
      el('#taskStatusSelect').value = t.status || 'Todo';
      loadComments(t.id);
      loadFiles(t.id);
      loadHistory(t.id);
    } else {
      renderProjectsSelect(el('#taskProject'));
      renderAssigneesSelect(el('#taskProject').value, '');
    }
    showModal();
  };

  const recordHistoryChanges = (oldObj, newObj) => {
    const fields = ['title','description','dueDate','assignedTo','priority','status','projectId'];
    const changes = [];
    fields.forEach(f => {
      const oldVal = oldObj ? oldObj[f] : undefined;
      const newVal = newObj[f];
      if (oldObj && oldVal === newVal) return;
      if (!oldObj && (newVal===undefined||newVal==='')) return;
      changes.push({ field:f, oldValue: oldVal, newValue: newVal });
    });
    if (!changes.length) return;
    const hist = load(HISTORY_KEY);
    const by = getUser().name;
    const when = nowIso();
    changes.forEach(c => hist.push({ id: crypto.randomUUID(), taskId: newObj.id, changedBy: by, changedField: c.field, oldValue: c.oldValue, newValue: c.newValue, changedAt: when }));
    save(HISTORY_KEY, hist);
  };

  ready(()=>{
    seedIfEmpty();
    const tbody = el('#taskTbody');
    const search = el('#taskSearch');
    const filtStatus = el('#taskStatus');
    const filtPriority = el('#taskPriority');
    const btnNew = el('#btnNewTask');

    renderAll();
    // Sorting by Priority header toggle
    const thPr = document.getElementById('thPriority');
    if (thPr) {
      const setLabel = ()=> { thPr.textContent = `Priority ${tableSort.dir==='asc'?'▲':'▼'}`; };
      setLabel();
      thPr.addEventListener('click', ()=>{ tableSort.dir = tableSort.dir==='asc' ? 'desc' : 'asc'; renderTable(); setLabel(); });
    }
    [search, filtStatus, filtPriority].forEach(c=> c.addEventListener('input', ()=> renderAll()));
    // Also listen for 'change' on selects to ensure re-render across browsers
    [filtStatus, filtPriority].forEach(sel=> sel.addEventListener('change', ()=> renderAll()));
    const canManage = hasRole('Leader');
    if (!canManage && btnNew) { btnNew.style.display = 'none'; }
    btnNew.addEventListener('click', ()=> { if (!canManage) { window.showToast && showToast('Only Leader or Admin can create tasks', 'error'); return; } resetForm(); el('#taskModalTitle').textContent = 'New task'; showModal(); });
    // View toggle
    const viewTableBtn = document.getElementById('viewTable');
    const viewBoardBtn = document.getElementById('viewBoard');
    const tableEl = document.getElementById('taskTable');
    const boardEl = document.getElementById('taskBoard');
    const projSel = el('#taskProject');
    projSel && projSel.addEventListener('change', ()=> renderAssigneesSelect(projSel.value, ''));
    const setView = (board)=>{
      if (board) {
        tableEl.hidden = true; boardEl.hidden = false;
        viewBoardBtn.classList.add('view-toggle__btn--active'); viewBoardBtn.setAttribute('aria-selected','true');
        viewTableBtn.classList.remove('view-toggle__btn--active'); viewTableBtn.setAttribute('aria-selected','false');
        renderBoard();
      } else {
        tableEl.hidden = false; boardEl.hidden = true;
        viewTableBtn.classList.add('view-toggle__btn--active'); viewTableBtn.setAttribute('aria-selected','true');
        viewBoardBtn.classList.remove('view-toggle__btn--active'); viewBoardBtn.setAttribute('aria-selected','false');
        renderTable();
      }
    };
    viewTableBtn.addEventListener('click', ()=> setView(false));
    viewBoardBtn.addEventListener('click', ()=> setView(true));
    document.querySelectorAll('#taskModal [data-close]').forEach(b=> b.addEventListener('click', ()=> hideModal()));
    document.querySelectorAll('#taskModal .tab').forEach(t=> t.addEventListener('click', ()=> switchTab(t.dataset.tab)));

    // Save / Delete
    const form = el('#taskForm');
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const id = el('#taskId').value || crypto.randomUUID();
      const proj = el('#taskProject').value;
      const obj = {
        id,
        projectId: proj,
        title: el('#taskTitle').value.trim(),
        description: el('#taskDesc').value.trim(),
        dueDate: el('#taskDue').value,
        assignedTo: el('#taskAssignee').value.trim(),
        priority: el('#taskPrioritySelect').value,
        status: el('#taskStatusSelect').value,
      };
      if (!obj.title) { el('#taskTitle').focus(); window.showToast && showToast('Task title is required', 'warning'); return; }
      const list = load(TASKS_KEY);
      const existing = list.find(x=>x.id===id);
      if (existing) {
        if (!hasRole('Leader')) {
          const me = (localStorage.getItem('tm.userName')||'User').trim();
          if ((existing.assignedTo||'').trim() !== me) { window.showToast && showToast('You can only edit your assigned tasks', 'error'); return; }
        }
        recordHistoryChanges(existing, { ...obj, id });
        Object.assign(existing, obj, { updatedAt: nowIso() }); window.showToast && showToast('Task updated', 'success');
      } else {
        if (!hasRole('Leader')) { window.showToast && showToast('Only Leader or Admin can create tasks', 'error'); return; }
        const created = { ...obj, createdAt: nowIso(), updatedAt: nowIso() };
        recordHistoryChanges(null, { ...created, id });
        list.push(created); window.showToast && showToast('Task created', 'success');
      }
      save(TASKS_KEY, list);
      hideModal();
      renderAll();
    });
    el('#btnDeleteTask').addEventListener('click', ()=>{
      if (!hasRole('Leader')) { window.showToast && showToast('Only Leader or Admin can delete tasks', 'error'); return; }
      const id = el('#taskId').value; if (!id) { hideModal(); return; }
      save(TASKS_KEY, load(TASKS_KEY).filter(t=>t.id!==id));
      save(COMMENTS_KEY, load(COMMENTS_KEY).filter(c=>c.taskId!==id));
      save(FILES_KEY, load(FILES_KEY).filter(f=>f.taskId!==id));
      save(HISTORY_KEY, load(HISTORY_KEY).filter(h=>h.taskId!==id));
      hideModal(); window.showToast && showToast('Task deleted', 'success');
      renderAll();
    });

    // Comments
    el('#btnAddComment').addEventListener('click', ()=>{
      const taskId = el('#taskId').value; if (!taskId) return;
      const text = el('#commentText').value.trim(); if (!text) { el('#commentText').focus(); window.showToast && showToast('Comment cannot be empty', 'warning'); return; }
      const list = load(COMMENTS_KEY); list.push({ id: crypto.randomUUID(), taskId, author: getUser().name, text, createdAt: nowIso() });
      save(COMMENTS_KEY, list); el('#commentText').value=''; loadComments(taskId); renderAll(); window.showToast && showToast('Comment added', 'success');
    });

    // Files
    el('#btnUploadFile').addEventListener('click', ()=>{
      const taskId = el('#taskId').value; if (!taskId) return;
      const input = el('#fileInput'); const file = input.files && input.files[0]; if (!file) { window.showToast && showToast('Please choose a file', 'warning'); return; }
      const reader = new FileReader();
      reader.onload = ()=>{
        const files = load(FILES_KEY);
        files.push({ id: crypto.randomUUID(), taskId, fileName: file.name, dataUrl: reader.result, uploadedBy: getUser().name, uploadedAt: nowIso() });
        save(FILES_KEY, files); input.value=''; loadFiles(taskId); renderAll(); window.showToast && showToast('File uploaded', 'success');
      };
      reader.readAsDataURL(file);
    });
  });
})();
