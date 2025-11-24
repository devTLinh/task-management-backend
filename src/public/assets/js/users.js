// Users management + Activity logs view (localStorage)
(function(){
  'use strict';
  const ready = (fn)=> document.readyState==='loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();
  const USERS_KEY = 'tm.users';
  const ACT_KEY = 'tm.activity';
  const el = (s)=> document.querySelector(s);
  const nowIso = ()=> new Date().toISOString();
  const escapeHtml = (s='')=> s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]||c));
  const load = (k)=> { try { return JSON.parse(localStorage.getItem(k)||'[]'); } catch { return []; } };
  const save = (k,v)=> localStorage.setItem(k, JSON.stringify(v));

  const seedIfEmpty = ()=>{
    const users = load(USERS_KEY);
    if (users.length) return;
    const name = (localStorage.getItem('tm.userName')||'Admin').trim();
    const email = (localStorage.getItem('tm.email')||'').trim();
    const me = { id: crypto.randomUUID(), name, email, role:'Admin', createdAt: nowIso(), updatedAt: nowIso() };
    save(USERS_KEY, [me]);
    localStorage.setItem('tm.role','Admin');
    window.logActivity && window.logActivity('seed users', `Seed admin ${name}`, 'User', me.id);
  };

  const renderUsers = ()=>{
    const q = (el('#userSearch')?.value||'').toLowerCase();
    const rf = el('#roleFilter')?.value||'all';
    const tbody = el('#userTable tbody');
    const role = (localStorage.getItem('tm.role')||'Member');
    const list = load(USERS_KEY).filter(u => (rf==='all'||u.role===rf) && (!q || u.name.toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q)));
    tbody.innerHTML = list.map(u=> {
      const canAdmin = role==='Admin';
      const actions = canAdmin ? '<button class="btn btn--white" data-edit>Edit</button> <button class="btn btn--white" data-del>Delete</button>' : '<button class="btn btn--white" data-edit>Edit</button>';
      return `<tr data-id="${u.id}"><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.email||'')}</td><td>${escapeHtml(u.role)}</td><td>${new Date(u.updatedAt||u.createdAt).toLocaleString()}</td><td>${actions}</td></tr>`;
    }).join('');
    tbody.querySelectorAll('button[data-edit]').forEach(b=> b.addEventListener('click', ()=> openEdit(b.closest('tr').dataset.id)));
    tbody.querySelectorAll('button[data-del]').forEach(b=> b.addEventListener('click', ()=> delUser(b.closest('tr').dataset.id)));
    // activity filter users
    const sel = el('#activityUser');
    if (sel && !sel.dataset.bound) {
      const options = ['All'].concat(load(USERS_KEY).map(u=>u.name));
      sel.innerHTML = options.map(n=>`<option>${escapeHtml(n)}</option>`).join('');
      sel.dataset.bound = '1';
    }
  };

  const openNew = ()=>{
    const myRole = (localStorage.getItem('tm.role')||'Member'); if (myRole!=='Admin') { window.showToast && showToast('Only Admin can create users', 'error'); return; }
    el('#userId').value = '';
    el('#userName').value = '';
    el('#userEmail').value = '';
    el('#userRole').value = 'Member';
    el('#userModalTitle').textContent = 'New user';
    el('#userModal').classList.add('show');
  };
  const openEdit = (id)=>{
    const u = load(USERS_KEY).find(x=>x.id===id); if (!u) return;
    el('#userId').value = u.id;
    el('#userName').value = u.name||'';
    el('#userEmail').value = u.email||'';
    el('#userRole').value = u.role||'Member';
    el('#userModalTitle').textContent = 'Edit user';
    // Non-admin cannot change role field
    const myRole = (localStorage.getItem('tm.role')||'Member');
    el('#userRole').disabled = (myRole!=='Admin');
    el('#userModal').classList.add('show');
  };
  const closeModal = ()=> el('#userModal').classList.remove('show');

  const saveUser = (e)=>{
    e.preventDefault();
    const id = el('#userId').value;
    const name = el('#userName').value.trim();
    const email = el('#userEmail').value.trim();
    const role = el('#userRole').value;
    if (!name) { el('#userName').focus(); return; }
    const myRole = (localStorage.getItem('tm.role')||'Member');
    const list = load(USERS_KEY);
    if (id) {
      const u = list.find(x=>x.id===id); if (!u) return;
      if (myRole !== 'Admin' && id !== (localStorage.getItem('tm.userId')||'')) { window.showToast && showToast('Only Admin can edit other accounts', 'error'); return; }
      const old = { ...u };
      const nextRole = (myRole==='Admin' ? role : u.role);
      Object.assign(u, { name, email, role: nextRole, updatedAt: nowIso() });
      window.logActivity && window.logActivity('update user', `${old.name} -> ${name} | role ${old.role} -> ${nextRole}`, 'User', id);
      // If editing self and role changed (Admin lowering/raising self), sync and reload
      const meId = localStorage.getItem('tm.userId')||'';
      if (id === meId && old.role !== nextRole) {
        localStorage.setItem('tm.role', nextRole);
        if (window.showToast) { showToast('Your role was updated. Reloading…', 'info'); }
        save(USERS_KEY, list);
        setTimeout(()=> location.reload(), 400);
        return;
      }
      window.showToast && showToast('User updated', 'success');
    } else {
      if (myRole !== 'Admin') { window.showToast && showToast('Only Admin can create users', 'error'); return; }
      const u = { id: crypto.randomUUID(), name, email, role, createdAt: nowIso(), updatedAt: nowIso() };
      list.push(u);
      window.logActivity && window.logActivity('create user', `${name} (${role})`, 'User', u.id);
      window.showToast && showToast('User created', 'success');
    }
    save(USERS_KEY, list);
    closeModal();
    renderUsers();
  };

  const delUser = (id)=>{
    const me = (localStorage.getItem('tm.role')||'Member');
    if (me !== 'Admin') { window.showToast && showToast('Only Admin can delete accounts', 'error'); return; }
    const list = load(USERS_KEY);
    const u = list.find(x=>x.id===id); if (!u) return;
    save(USERS_KEY, list.filter(x=>x.id!==id));
    window.logActivity && window.logActivity('delete user', u.name, 'User', id);
    window.showToast && showToast('User deleted', 'success');
    renderUsers();
  };

  const renderActivity = ()=>{
    const q = (el('#activitySearch')?.value||'').toLowerCase();
    const who = el('#activityUser')?.value||'All';
    const tbody = el('#activityTable tbody');
    const list = load(ACT_KEY)
      .filter(a => (who==='All' || a.user===who) && (!q || (a.action||'').toLowerCase().includes(q) || (a.detail||'').toLowerCase().includes(q)))
      .sort((a,b)=> new Date(b.at)-new Date(a.at));
    tbody.innerHTML = list.map(a=> `<tr><td>${new Date(a.at).toLocaleString()}</td><td>${escapeHtml(a.user)}</td><td>${escapeHtml(a.action)}</td><td>${escapeHtml(a.detail||'')}</td></tr>`).join('');
  };

  ready(()=>{
    seedIfEmpty();
    renderUsers();
    renderActivity();
    // tabs
    document.querySelectorAll('.tab').forEach(t=> t.addEventListener('click', ()=>{
      const tab = t.dataset.tab; document.querySelectorAll('.tab').forEach(b=> b.classList.toggle('tab--active', b===t));
      document.querySelectorAll('.tabpane').forEach(p=> p.classList.toggle('tabpane--active', p.dataset.pane===tab));
    }));
    // events
    el('#btnNewUser').addEventListener('click', openNew);
    el('#userForm').addEventListener('submit', saveUser);
    el('#btnDeleteUser').addEventListener('click', ()=> delUser(el('#userId').value));
    document.querySelectorAll('#userModal [data-close]').forEach(b=> b.addEventListener('click', closeModal));
    el('#userSearch').addEventListener('input', renderUsers);
    el('#roleFilter').addEventListener('change', renderUsers);
    el('#activitySearch').addEventListener('input', renderActivity);
    el('#activityUser').addEventListener('change', renderActivity);
    el('#btnClearActivity').addEventListener('click', ()=>{ const me = (localStorage.getItem('tm.role')||'Member'); if (me!=='Admin') { window.showToast && showToast('Only Admin can clear logs', 'error'); return; } localStorage.removeItem(ACT_KEY); renderActivity(); window.showToast && showToast('Logs cleared', 'success'); });
    // Hide New User button for non-admin
    const btnNew = el('#btnNewUser'); if (btnNew && (localStorage.getItem('tm.role')||'Member')!=='Admin') btnNew.style.display='none';
  });
})();
