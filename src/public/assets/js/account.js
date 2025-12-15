//// Account management: view/update own profile; admin can change others' roles
//(function(){
//  'use strict';
//  const ready = (fn)=> document.readyState==='loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();
//  const el = (s)=> document.querySelector(s);
//  const load = (k)=> { try { return JSON.parse(localStorage.getItem(k)||'[]'); } catch { return []; } };
//  const save = (k,v)=> localStorage.setItem(k, JSON.stringify(v));
//  const USERS_KEY = 'tm.users';
//  const now = ()=> new Date().toISOString();
//  const escapeHtml = (s='')=> s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]||c));
//  const textEnc = new TextEncoder();
//  const toHex = (buf)=> Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
//  const sha256 = async (txt)=> {
//    try { const d = await crypto.subtle.digest('SHA-256', textEnc.encode(txt)); return toHex(d); } catch { return btoa(unescape(encodeURIComponent(txt))); }
//  };

//  const getUsername = (name, email) => {
//    if (email && email.includes('@')) return email.split('@')[0];
//    if (!name) return 'user';
//    return name.toLowerCase().replace(/\s+/g,'_');
//  };

//  const findOrCreateCurrentUser = () => {
//    const users = load(USERS_KEY);
//    const name = (localStorage.getItem('tm.userName')||'User').trim();
//    const email = (localStorage.getItem('tm.email')||'').trim();
//    let id = localStorage.getItem('tm.userId');
//    let me = id ? users.find(u=>u.id===id) : null;
//    if (!me && email) me = users.find(u=> (u.email||'').toLowerCase()===email.toLowerCase());
//    if (!me) me = users.find(u=> u.name===name);
//    if (!me) {
//      me = { id: crypto.randomUUID(), name, email, role: (localStorage.getItem('tm.role')||'Member'), createdAt: now(), updatedAt: now() };
//      users.push(me); save(USERS_KEY, users);
//    }
//    localStorage.setItem('tm.userId', me.id);
//    return me;
//  };

//  const renderProfile = (me) => {
//    el('#accUsername').value = getUsername(me.name, me.email);
//    el('#accRole').value = me.role || 'Member';
//    el('#accFullName').value = me.name || '';
//    el('#accEmail').value = me.email || '';
//    const hint = `Updated: ${new Date(me.updatedAt||me.createdAt).toLocaleString()}`;
//    el('#accountHint').textContent = hint;
//  };

//  const showPwdModal = ()=>{ document.getElementById('pwdModal')?.classList.add('show'); };
//  const hidePwdModal = ()=>{ document.getElementById('pwdModal')?.classList.remove('show'); };

//  const renderAdminTable = () => {
//    const role = (localStorage.getItem('tm.role')||'Member');
//    if (role !== 'Admin') { el('#adminTab').hidden = true; return; }
//    el('#adminTab').hidden = false;
//    const tbody = document.querySelector('#adminUserTable tbody');
//    const users = load(USERS_KEY);
//    tbody.innerHTML = users.map(u=> `<tr data-id="${u.id}"><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.email||'')}</td><td><select class="roleSel"><option ${u.role==='Member'?'selected':''}>Member</option><option ${u.role==='Leader'?'selected':''}>Leader</option><option ${u.role==='Admin'?'selected':''}>Admin</option></select></td><td>${new Date(u.updatedAt||u.createdAt).toLocaleString()}</td><td><button class="btn btn--white" data-save>Update</button></td></tr>`).join('');
//    tbody.querySelectorAll('button[data-save]').forEach(btn => btn.addEventListener('click', ()=>{
//      const tr = btn.closest('tr'); const id = tr.dataset.id; const sel = tr.querySelector('.roleSel');
//      const arr = load(USERS_KEY); const u = arr.find(x=>x.id===id); if (!u) return;
//      const old = u.role; const newRole = sel.value;
//      if (old!==newRole) {
//        u.role = newRole; u.updatedAt = now(); save(USERS_KEY, arr);
//        window.logActivity && window.logActivity('change role', `${u.name}: ${old} -> ${newRole}`, 'User', id);
//        // If admin updated their own role, sync to localStorage and reload to apply RBAC immediately
//        const meId = localStorage.getItem('tm.userId');
//        if (id === meId) {
//          localStorage.setItem('tm.role', newRole);
//          if (window.showToast) { showToast('Your role was updated. Reloading…', 'info'); }
//          setTimeout(()=> location.reload(), 400);
//        } else {
//          renderAdminTable();
//        }
//      }
//    }));
//  };

//  ready(()=>{
//    // tabs
//    document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', ()=>{
//      const tab = t.dataset.tab; document.querySelectorAll('.tab').forEach(b=> b.classList.toggle('tab--active', b===t));
//      document.querySelectorAll('.tabpane').forEach(p=> p.classList.toggle('tabpane--active', p.dataset.pane===tab));
//    }));

//    const me = findOrCreateCurrentUser();
//    renderProfile(me);
//    renderAdminTable();

//    el('#accountForm').addEventListener('submit', (e)=>{
//      e.preventDefault();
//      const full = el('#accFullName').value.trim();
//      const email = el('#accEmail').value.trim();
//      const arr = load(USERS_KEY);
//      const id = localStorage.getItem('tm.userId');
//      const u = arr.find(x=>x.id===id);
//      if (u) {
//        const old = { ...u };
//        Object.assign(u, { name: full, email, updatedAt: now() });
//        save(USERS_KEY, arr);
//        localStorage.setItem('tm.userName', full);
//        if (email) localStorage.setItem('tm.email', email); else localStorage.removeItem('tm.email');
//        window.logActivity && window.logActivity('update profile', `${old.name} -> ${full}`, 'User', id);
//        renderProfile(u);
//        window.showToast && showToast('Profile saved', 'success');
//      }
//    });

//    // Password change flow
//    const btnPwd = el('#btnChangePwd');
//    const pwdModal = document.getElementById('pwdModal');
//    const pwdForm = document.getElementById('pwdForm');
//    const groupCurrent = document.getElementById('groupCurrent');
//    const pwdHint = document.getElementById('pwdHint');
//    const getStoredHash = ()=> localStorage.getItem('tm.pass') || '';
//    const setStoredHash = (h)=> localStorage.setItem('tm.pass', h);
//    btnPwd?.addEventListener('click', ()=>{
//      const hasPwd = !!getStoredHash();
//      if (groupCurrent) groupCurrent.style.display = hasPwd ? 'block' : 'none';
//      if (pwdHint) pwdHint.textContent = hasPwd ? 'Enter your current password to set a new one.' : 'You do not have a password yet. Set one now.';
//      // reset fields
//      const f = pwdForm; if (f) { f.reset(); }
//      showPwdModal();
//    });
//    pwdModal?.querySelectorAll('[data-close]')?.forEach(b=> b.addEventListener('click', hidePwdModal));
//    pwdForm?.addEventListener('submit', async (e)=>{
//      e.preventDefault();
//      const current = el('#pwdCurrent')?.value || '';
//      const next = el('#pwdNew')?.value || '';
//      const confirm = el('#pwdConfirm')?.value || '';
//      const stored = getStoredHash();
//      if (stored) {
//        const curHash = await sha256(current);
//        if (curHash !== stored) { window.showToast && showToast('Current password is incorrect', 'error'); return; }
//      }
//      if (next.length < 6) { window.showToast && showToast('New password must be at least 6 characters', 'warning'); return; }
//      if (next !== confirm) { window.showToast && showToast('Passwords do not match', 'error'); return; }
//      if (stored) {
//        const curHash = await sha256(current);
//        const newHash = await sha256(next);
//        if (curHash === newHash) { window.showToast && showToast('New password must be different', 'warning'); return; }
//        setStoredHash(newHash);
//      } else {
//        const newHash = await sha256(next); setStoredHash(newHash);
//      }
//      // persist to user record as well (optional convenience)
//      const arr = load(USERS_KEY); const id = localStorage.getItem('tm.userId'); const u = arr.find(x=>x.id===id);
//      if (u) { u.passwordHash = getStoredHash(); u.updatedAt = now(); save(USERS_KEY, arr); }
//      hidePwdModal();
//      window.showToast && showToast('Password updated', 'success');
//    });
//  });
//})();

// Account management using API + /api/me
(function () {
    'use strict';

    const ready = (fn) =>
        document.readyState === 'loading'
            ? document.addEventListener('DOMContentLoaded', fn, { once: true })
            : fn();

    const el = (s) => document.querySelector(s);
    const escapeHtml = (s = '') =>
        s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));

    const textEnc = new TextEncoder();
    const toHex = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    const sha256 = async (txt) => {
        try {
            const d = await crypto.subtle.digest('SHA-256', textEnc.encode(txt));
            return toHex(d);
        } catch {
            return btoa(unescape(encodeURIComponent(txt)));
        }
    };

    // -----------------------------
    // API HELPERS
    // -----------------------------
    async function apiGetMe() {
        const res = await fetch('/api/me', { credentials: 'include' });
        const data = await res.json();
        return data.user || null;
    }

    async function apiUpdateUser(payload) {
        const res = await fetch('/api/edit-user', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        return res.json();
    }

    async function apiGetAllUsers() {
        const res = await fetch('/api/get-all-users', { credentials: 'include' });
        const data = await res.json();
        return data.users || [];
    }

    // -----------------------------
    // RENDER PROFILE
    // -----------------------------
    const renderProfile = (me) => {
        el('#accUsername').value = me.UserName || '';
        el('#accRole').value = me.Role || 'Member';
        el('#accFullName').value = me.FullName || '';
        el('#accEmail').value = me.Email || '';
        el('#accountHint').textContent = `Updated: ${new Date(me.UpdatedAt || me.CreatedAt).toLocaleString()}`;
    };

    // -----------------------------
    // ADMIN TABLE
    // -----------------------------
    async function renderAdminTable() {
        const me = await apiGetMe();
        if (!me || me.Role !== 'Admin') {
            el('#adminTab').hidden = true;
            return;
        }

        el('#adminTab').hidden = false;

        const tbody = document.querySelector('#adminUserTable tbody');
        const users = await apiGetAllUsers();

        tbody.innerHTML = users
            .map(
                (u) => `
      <tr data-id="${u.UserID}">
        <td>${escapeHtml(u.FullName)}</td>
        <td>${escapeHtml(u.Email || '')}</td>
        <td>
          <select class="roleSel">
            <option ${u.Role === 'Member' ? 'selected' : ''}>Member</option>
            <option ${u.Role === 'Leader' ? 'selected' : ''}>Leader</option>
            <option ${u.Role === 'Admin' ? 'selected' : ''}>Admin</option>
          </select>
        </td>
        <td>${new Date(u.UpdatedAt || u.CreatedAt).toLocaleString()}</td>
        <td><button class="btn btn--white" data-save>Update</button></td>
      </tr>`
            )
            .join('');

        tbody.querySelectorAll('button[data-save]').forEach((btn) =>
            btn.addEventListener('click', async () => {
                const tr = btn.closest('tr');
                const id = tr.dataset.id;
                const newRole = tr.querySelector('.roleSel').value;

                const result = await apiUpdateUser({
                    UserID: id,
                    Role: newRole
                });

                if (result.errorCode === 0) {
                    window.showToast && showToast('Role updated', 'success');
                    window.logActivity && logActivity('change role', `Updated role to ${newRole}`, 'User', id);
                    renderAdminTable();
                } else {
                    window.showToast && showToast(result.errorMessage, 'error');
                }
            })
        );
    }

    // -----------------------------
    // MAIN READY
    // -----------------------------
    ready(async () => {
        // Tabs
        document.querySelectorAll('.tab').forEach((t) =>
            t.addEventListener('click', () => {
                const tab = t.dataset.tab;
                document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('tab--active', b === t));
                document.querySelectorAll('.tabpane').forEach((p) => p.classList.toggle('tabpane--active', p.dataset.pane === tab));
            })
        );

        // Load current user
        const me = await apiGetMe();
        if (!me) return;

        renderProfile(me);
        renderAdminTable();

        // Update profile
        el('#accountForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const payload = {
                UserID: me.UserID,
                FullName: el('#accFullName').value.trim(),
                Email: el('#accEmail').value.trim()
            };

            const result = await apiUpdateUser(payload);

            if (result.errorCode === 0) {
                window.showToast && showToast('Profile saved', 'success');
                window.logActivity && logActivity('update profile', payload.FullName, 'User', me.UserID);
                renderProfile(result.user);
            } else {
                window.showToast && showToast(result.errorMessage, 'error');
            }
        });

        // Password change
        const btnPwd = el('#btnChangePwd');
        const pwdModal = document.getElementById('pwdModal');
        const pwdForm = document.getElementById('pwdForm');

        btnPwd?.addEventListener('click', () => {
            pwdForm.reset();
            pwdModal.classList.add('show');
        });

        pwdModal?.querySelectorAll('[data-close]')?.forEach((b) =>
            b.addEventListener('click', () => pwdModal.classList.remove('show'))
        );

        pwdForm?.addEventListener('submit', async (e) => {
            e.preventDefault();

            const newPwd = el('#pwdNew')?.value || '';
            const confirm = el('#pwdConfirm')?.value || '';

            if (newPwd !== confirm) {
                window.showToast && showToast('Passwords do not match', 'error');
                return;
            }

            const hash = await sha256(newPwd);

            const result = await apiUpdateUser({
                UserID: me.UserID,
                PasswordHash: hash
            });

            if (result.errorCode === 0) {
                window.showToast && showToast('Password updated', 'success');
                pwdModal.classList.remove('show');
            } else {
                window.showToast && showToast(result.errorMessage, 'error');
            }
        });
    });
})();

