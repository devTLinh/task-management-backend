// Full-featured Projects module: CRUD, statuses, members, cascade delete
(function () {
  'use strict';

  const ready = (fn) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn();
  const STORAGE_KEY = 'tm.projects';
  const statuses = ['planning', 'inprogress', 'completed', 'onhold'];
  const nowIso = () => new Date().toISOString();

  const getUser = () => ({ name: (localStorage.getItem('tm.userName') || 'User').trim(), email: (localStorage.getItem('tm.email') || '').trim() });
  const getRole = () => (localStorage.getItem('tm.role') || 'Member');
  const roleRank = { Member:1, Leader:2, Admin:3 };
  const hasRole = (min) => (roleRank[getRole()]||1) >= (roleRank[min]||1);
  const el = (sel) => document.querySelector(sel);
  const col = (key) => el(`#col-${key}`);
  const load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } };
  const save = (list) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  const escapeHtml = (s = '') => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] || c));

  const seedIfEmpty = () => {
    const data = load();
    if (data.length) return;
    const user = getUser();
    const demo = [
      { id: crypto.randomUUID(), name: 'Personal website', description: 'Portfolio & blog', startDate: '', endDate: '', type: 'personal', status: 'planning', owner: user.name, createdBy: user.name, tags: ['UX'], members: [{ name: user.name, role: 'Leader', joinedAt: nowIso() }], createdAt: nowIso(), updatedAt: nowIso() },
      { id: crypto.randomUUID(), name: 'Mobile app v2', description: 'Revamp UI/UX', startDate: '', endDate: '', type: 'team', status: 'inprogress', owner: 'Team', createdBy: user.name, tags: ['High', 'iOS'], members: [], createdAt: nowIso(), updatedAt: nowIso() },
      { id: crypto.randomUUID(), name: 'Bug triage sprint', description: 'Stability sprint', startDate: '', endDate: '', type: 'team', status: 'completed', owner: 'Team', createdBy: user.name, tags: ['OKR'], members: [], createdAt: nowIso(), updatedAt: nowIso() },
    ];
    save(demo);
  };

  const render = () => {
    const filterType = el('#filterType').value;
    const list = load();
    // Sort by saved order within each status to keep visual order consistent
    list.sort((a, b) => (a.status === b.status) ? ((a.order ?? 0) - (b.order ?? 0)) : 0);
    statuses.forEach(k => { const c = col(k); if (c) c.innerHTML = ''; });
    list
      .filter(p => filterType === 'all' ? true : p.type === filterType)
      .forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = p.id;
        card.setAttribute('draggable', 'true');
        const badgeClass = p.type === 'personal' ? 'badge--personal' : 'badge--team';
        const normalize = (s = '') => (typeof s === 'string' && s.normalize) ? s.normalize('NFC') : (s || '');
        const title = normalize((p.name || '').trim()) || 'Untitled Project';
        const ownerTag = (p.type === 'personal' && (p.owner || '').trim()) ? `<span class="tag"><i class=\"fa-regular fa-id-badge\"></i>${escapeHtml(normalize(p.owner))}</span>` : '';
        const createdBy = (p.createdBy || '').trim();
        const creatorTag = createdBy ? `<span class="tag"><i class=\"fa-regular fa-user\"></i>${escapeHtml(normalize(createdBy))}</span>` : '';
        const tagsHtml = (p.tags || []).map(t => `<span class="tag">${escapeHtml(normalize(String(t)))}</span>`).join('');
        card.innerHTML = `
          <div class="card__title">${escapeHtml(title)}</div>
          <div class="card__meta">
            <span class="badge ${badgeClass}">${p.type === 'personal' ? 'Personal' : 'Team'}</span>
            ${ownerTag}
            ${creatorTag}
            ${tagsHtml}
          </div>`;
        if (p.type === 'personal') {
          const o = (p.owner || '').trim().toLowerCase();
          const c = createdBy.trim().toLowerCase();
          if (o && c && o === c && creatorTag) {
            card.innerHTML = card.innerHTML.replace(creatorTag, '');
          }
        }
        const container = col(p.status) || col('planning');
        container && container.appendChild(card);
      });
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('dblclick', () => { if (!hasRole('Leader')) { window.showToast && showToast('Only Leader or Admin can edit projects', 'error'); return; } openEdit(card.dataset.id); });
      card.addEventListener('dragstart', (e)=>{ if (!hasRole('Leader')) { e.preventDefault(); return; } e.dataTransfer.setData('text/plain', card.dataset.id); card.classList.add('dragging'); });
      card.addEventListener('dragend', ()=> card.classList.remove('dragging'));
    });

    const getDragAfterElement = (container, y) => {
      const els = [...container.querySelectorAll('.card:not(.dragging)')];
      const MARGIN = 4; // px hysteresis to avoid jitter near midline
      return els.reduce((closest, child)=>{
        const box = child.getBoundingClientRect();
        const offset = y - (box.top + box.height/2);
        if ((offset < -MARGIN) && (offset > closest.offset)) { return { offset, element: child }; }
        return closest;
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    };

    ['planning','inprogress','completed','onhold'].forEach(st=>{
      const listEl = col(st);
      if (!listEl) return;
      // Throttled dragover to reduce reflow jitter
      let raf = null; let lastY = 0;
      listEl.addEventListener('dragover', (e)=>{
        if (!hasRole('Leader')) return;
        e.preventDefault();
        listEl.classList.add('drag-over');
        lastY = e.clientY;
        if (raf) return;
        raf = requestAnimationFrame(()=>{
          raf = null;
          const after = getDragAfterElement(listEl, lastY);
          const dragging = document.querySelector('.card.dragging');
          if (!dragging) return;
          if (after == null) {
            if (listEl.lastElementChild !== dragging) listEl.appendChild(dragging);
          } else {
            if (after !== dragging.nextElementSibling || dragging.parentElement !== listEl) {
              listEl.insertBefore(dragging, after);
            }
          }
        });
      });
      listEl.addEventListener('dragleave', ()=> listEl.classList.remove('drag-over'));
      listEl.addEventListener('drop', (e)=>{
        if (!hasRole('Leader')) { e.preventDefault(); listEl.classList.remove('drag-over'); window.showToast && showToast('Only Leader or Admin can change status/order', 'error'); return; }
        e.preventDefault(); listEl.classList.remove('drag-over');
        const id = e.dataTransfer.getData('text/plain'); if (!id) return;
        const arr = load();
        const proj = arr.find(x=>x.id===id); if (!proj) return;
        const oldStatus = proj.status;
        proj.status = st; proj.updatedAt = nowIso();
        // Ensure the dragged element is appended even if column was empty (no prior dragover insertion)
        const dragging = document.querySelector('.card.dragging');
        if (dragging && dragging.parentElement !== listEl) listEl.appendChild(dragging);
        // persist order by DOM sequence
        const ids = [...listEl.querySelectorAll('.card')].map(x=>x.dataset.id);
        ids.forEach((pid, idx)=>{ const p = arr.find(x=>x.id===pid); if (p) p.order = idx; });
        save(arr);
        render();
        if (window.showToast) {
          const msg = (oldStatus !== st) ? `Moved to ${st}` : 'Order updated';
          showToast(msg, 'success');
        }
      });
    });
  };

  const showModal = () => el('#projectModal').classList.add('show');
  const hideModal = () => el('#projectModal').classList.remove('show');
  const resetForm = () => {
    el('#projId').value = '';
    el('#projName').value = '';
    el('#projDesc').value = '';
    el('#projStart').value = '';
    el('#projEnd').value = '';
    el('#projType').value = 'team';
    el('#projStatus').value = 'planning';
    const tbody = el('#memberTable tbody'); if (tbody) tbody.innerHTML = '';
  };
  // Ensure project exists when adding members from a fresh form
  const ensureProjectExists = () => {
    let id = el('#projId').value;
    if (id) return id;
    const name = el('#projName').value.trim();
    const description = el('#projDesc').value.trim();
    const startDate = el('#projStart').value;
    const endDate = el('#projEnd').value;
    const type = el('#projType').value || 'team';
    const status = el('#projStatus').value || 'planning';
    if (!name) { el('#projName').focus(); return null; }
    const list = load();
    id = crypto.randomUUID();
    list.push({ id, name, description, startDate, endDate, type, status, owner: type === 'personal' ? getUser().name : 'Team', createdBy: getUser().name, tags: [], members: [], createdAt: nowIso(), updatedAt: nowIso() });
    save(list);
    el('#projId').value = id;
    return id;
  };
  const switchTab = (tab) => {
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('tab--active', b.dataset.tab === tab));
    document.querySelectorAll('.tabpane').forEach(p => p.classList.toggle('tabpane--active', p.dataset.pane === tab));
  };
  const loadMembers = (proj) => {
    const tbody = el('#memberTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    (proj.members || []).forEach((m, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.role)}</td><td>${new Date(m.joinedAt).toLocaleString()}</td><td><button class="user-dropdown__item" data-del="${idx}">Remove</button></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('button[data-del]').forEach(btn => btn.addEventListener('click', () => {
      const idx = +btn.dataset.del;
      const id = el('#projId').value;
      const list = load();
      const p = list.find(x => x.id === id);
      if (!p) return;
      p.members.splice(idx, 1);
      p.updatedAt = nowIso();
      save(list);
      loadMembers(p);
      render();
      window.showToast && showToast('Member removed', 'success');
    }));
  };
  const openEdit = (id) => {
    const list = load();
    const p = list.find(x => x.id === id);
    if (!p) return;
    el('#modalTitle').textContent = 'Edit project';
    switchTab('info');
    el('#projId').value = p.id;
    el('#projName').value = p.name || '';
    el('#projDesc').value = p.description || '';
    el('#projStart').value = p.startDate || '';
    el('#projEnd').value = p.endDate || '';
    el('#projType').value = p.type || 'team';
    el('#projStatus').value = p.status || 'planning';
    loadMembers(p);
    showModal();
  };
  const cascadeDelete = (projectId) => {
    ['tm.tasks', 'tm.comments', 'tm.files'].forEach(k => { try { const arr = JSON.parse(localStorage.getItem(k) || '[]'); localStorage.setItem(k, JSON.stringify(arr.filter(x => x.projectId !== projectId))); } catch { } });
  };

  ready(() => {
    seedIfEmpty();
    const filterType = el('#filterType');
    const btnNew = el('#btnNewProject');
    const modal = el('#projectModal');
    const form = el('#projectForm');
    const user = getUser();
    const canManage = hasRole('Leader');

    render();

    filterType.addEventListener('change', render);
    btnNew && btnNew.addEventListener('click', () => { if (!canManage) { window.showToast && showToast('Only Leader or Admin can create projects', 'error'); return; } resetForm(); el('#modalTitle').textContent = 'Create new project'; switchTab('info'); showModal(); });
    modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', hideModal));
    document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
    const addMemberBtn = el('#btnAddMember');
    // Hide UI controls for members
    if (!canManage) {
      btnNew && (btnNew.style.display = 'none');
      const membersTabBtn = document.querySelector('.tab[data-tab="members"]');
      if (membersTabBtn) membersTabBtn.style.display = 'none';
      const delBtnEl = el('#btnDeleteProject'); if (delBtnEl) delBtnEl.style.display = 'none';
    }
    if (addMemberBtn) addMemberBtn.addEventListener('click', () => {
      if (!canManage) { window.showToast && showToast('Only Leader or Admin can add members', 'error'); return; }
      let id = el('#projId').value;
      if (!id) { id = ensureProjectExists(); if (!id) { window.showToast && showToast('Project name is required', 'warning'); return; } }
      const name = el('#memberName').value.trim();
      const role = el('#memberRole').value;
      if (!name) { el('#memberName').focus(); window.showToast && showToast('Please enter member name', 'warning'); return; }
      const list = load(); const p = list.find(x => x.id === id); if (!p) return;
      p.members = p.members || []; p.members.push({ name, role, joinedAt: nowIso() }); p.updatedAt = nowIso();
      save(list); el('#memberName').value = ''; loadMembers(p); render(); window.showToast && showToast('Member added', 'success');
    });
    const delBtn = el('#btnDeleteProject'); if (delBtn) delBtn.addEventListener('click', () => { if (!canManage) { window.showToast && showToast('Only Leader or Admin can delete projects', 'error'); return; } const id = el('#projId').value; if (!id) { hideModal(); return; } const list = load().filter(p => p.id !== id); save(list); cascadeDelete(id); hideModal(); render(); window.showToast && showToast('Project deleted', 'success'); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!canManage) { window.showToast && showToast('Only Leader or Admin can save projects', 'error'); return; }
      const id = el('#projId').value;
      const norm = (s='') => (typeof s==='string' && s.normalize) ? s.normalize('NFC') : (s||'');
      const name = norm((el('#projName').value || '').trim());
      const description = norm((el('#projDesc').value || '').trim());
      const startDate = el('#projStart').value;
      const endDate = el('#projEnd').value;
      const type = el('#projType').value;
      const status = el('#projStatus').value;
      if (!name) { el('#projName').focus(); window.showToast && showToast('Project name is required', 'warning'); return; }
      const list = load();
      if (id) {
        const p = list.find(x => x.id === id);
        if (p) { Object.assign(p, { name, description, startDate, endDate, type, status, owner: type === 'personal' ? getUser().name : (p.owner||'Team'), updatedAt: nowIso() }); window.showToast && showToast('Project updated', 'success'); }
      } else {
        list.push({ id: crypto.randomUUID(), name, description, startDate, endDate, type, status, owner: type === 'personal' ? getUser().name : 'Team', createdBy: getUser().name, tags: [], members: [], createdAt: nowIso(), updatedAt: nowIso() }); window.showToast && showToast('Project created', 'success');
      }
      save(list); hideModal(); form.reset(); render();
    });
  });
})();
