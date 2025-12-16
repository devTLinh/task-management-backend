// Users management + Activity logs (API backend, no localStorage)
(function () {
    'use strict';

    const ready = (fn) =>
        document.readyState === 'loading'
            ? document.addEventListener('DOMContentLoaded', fn, { once: true })
            : fn();

    const el = (s) => document.querySelector(s);
    const escapeHtml = (s = '') =>
        s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));

    // ✅ API helper
    async function api(url, method = 'GET', body = null) {
        const opt = { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include' };
        if (body) opt.body = JSON.stringify(body);

        try {
            const res = await fetch(url, opt);
            return await res.json();
        } catch (err) {
            console.error('API error:', err);
            return { errorCode: 500, errorMessage: 'Server error' };
        }
    }

    // ✅ Load current logged-in user
    async function loadCurrentUser() {
        const res = await api('/api/me');
        return res.user || null;
    }

    // ✅ Activity log API
    async function logActivity(action, userId) {
        console.log("logActivity payload:", { action, userId });
        await api('/api/create-activitylog', 'POST', {
            action,
            userId
        });
    }

    // ✅ Load all users
    async function loadUsers() {
        const res = await api('/api/get-all-users');
        return res.users || [];
    }

    // ✅ Load activity logs
    async function loadActivityLogs() {
        const res = await api('/api/get-all-activitylog-or-user-action');
        return res.data || [];
    }

    let CURRENT_USER = null;

    // ✅ Render Users Table
    async function renderUsers() {
        const q = (el('#userSearch')?.value || '').toLowerCase();
        const rf = el('#roleFilter')?.value || 'all';
        const tbody = el('#userTable tbody');

        const users = await loadUsers();
        const myRole = CURRENT_USER?.Role || 'Member';

        const list = users.filter(
            (u) =>
                (rf === 'all' || u.Role === rf) &&
                (!q ||
                    u.FullName.toLowerCase().includes(q) ||
                    u.Email.toLowerCase().includes(q) ||
                    u.UserName.toLowerCase().includes(q))
        );

        tbody.innerHTML = list
            .map((u) => {
                const actions =
                    myRole === 'Admin'
                        ? `
              <button class="btn btn--white" data-edit>Edit</button>
              <button class="btn btn--white" data-del>Delete</button>
                `
                : (u.UserID === CURRENT_USER.UserID
                    ? `<button class="btn btn--white" data-edit>Edit</button>`
                    : ``);

                return `
              <tr data-id="${u.UserID}">
                <td>${escapeHtml(u.FullName)}</td>
                <td>${escapeHtml(u.Email)}</td>
                <td>${escapeHtml(u.Role)}</td>
                <td>${new Date(u.UpdatedAt || u.CreatedAt).toLocaleString()}</td>
                <td>${actions}</td>
              </tr>`;
                    })
            .join('');


        tbody.querySelectorAll('button[data-edit]').forEach((b) =>
            b.addEventListener('click', () => openEdit(b.closest('tr').dataset.id))
        );
        tbody.querySelectorAll('button[data-del]').forEach((b) =>
            b.addEventListener('click', () => delUser(b.closest('tr').dataset.id))
        );

        // ✅ Fill activity user filter
        const sel = el('#activityUser');
        if (sel && !sel.dataset.bound) {
            sel.innerHTML = `<option value="All">All</option>` +
                users.map((u) => `<option value="${escapeHtml(String(u.UserID))}">${escapeHtml(u.FullName)}</option>`).join('');
            sel.dataset.bound = '1';
        }
    }

    // ✅ Open New User Modal
    function openNew() {
        if (CURRENT_USER.Role !== 'Admin') {
            showToast('Only Admin can create users', 'error');
            return;
        }
        el('#userEmail').value = '';
        el('#userFullName').value = '';
        el('#userRole').value = 'Member';
        el('#btnDeleteUser').style.display = 'none';
        el('#password').style.display = '';
        el('#userModalTitle').textContent = 'New user';
        el('#userModal').classList.add('show');

        
    }

    // ✅ Open Edit User Modal
    async function openEdit(id) {
        const users = await loadUsers();
        const u = users.find((x) => x.UserID == id);
        if (!u) return;

        el('#userId').value = u.UserID;

        el('#userFullName').value = u.FullName;

        el('#userEmail').value = u.Email;

        el('#userRole').value = u.Role;
        el('#userRole').disabled = CURRENT_USER.Role !== 'Admin';
        el('#btnDeleteUser').style.display = '';
        el('#password').style.display = 'none';
        el('#userModalTitle').textContent = 'Edit user';
        el('#userModal').classList.add('show');
    }
    function closeModal() {
        el('#userModal').classList.remove('show');
    }

    // ✅ Save User (Create or Edit)
    async function saveUser(e) {
        e.preventDefault();

        const id = el('#userId').value;
        const email = el('#userEmail').value.trim();
        const fullName = el('#userFullName').value.trim();
        const role = el('#userRole').value;

        if ( !email || !fullName) {
            showToast('Missing required fields', 'error');
            return;
        }

        if (id) {
            const userName = email.split('@')[0];
            // ✅ Update user
            const body = { id, userName, email, fullName, role };
            const res = await api('/api/edit-user', 'PUT', body);
            if (res.errorCode === 0) {
                const content = `User ${fullName} (ID: ${id}) updated by ${CURRENT_USER.FullName} (ID: ${CURRENT_USER.UserID})`;
                await logActivity(content, CURRENT_USER.UserID);
                CURRENT_USER = await loadCurrentUser();
                showToast('User updated', 'success');
            } else {
                showToast(res.errorMessage, 'error');
            }
        } else {
            // ✅ Create user
            if (CURRENT_USER.Role !== 'Admin') {
                showToast('Only Admin can create users', 'error');
                return;
            }
            const userName = email.split('@')[0];
            const password = el('#passwordInput').value;
            const body = { userName, email, password, fullName, role };
            const res = await api('/api/create-user', 'POST', body);

            if (res.errorCode === 0) {
                const content = `User ${fullName} create by ${CURRENT_USER.FullName} (ID: ${CURRENT_USER.UserID})`;
                await logActivity(content, CURRENT_USER.UserID);
                showToast('User created', 'success');
            } else {
                showToast(res.errorMessage, 'error');
            }
        }

        closeModal();
        renderUsers();
    }

    // ✅ Delete User
    async function delUser(id) {
        if (CURRENT_USER.Role !== 'Admin') {
            showToast('Only Admin can delete accounts', 'error');
            return;
        }

        const res = await api(`/api/delete-user-by-id?id=${id}`, 'DELETE');

        if (res.errorCode === 0) {
            const content = `User ID: ${id} delete by ${CURRENT_USER.FullName} (ID: ${CURRENT_USER.UserID})`;
            await logActivity(content, CURRENT_USER.UserID);
            showToast('User deleted', 'success');
            renderUsers();
        } else {
            showToast(res.errorMessage, 'error');
        }
    }

    // ✅ Render Activity Logs
    async function renderActivity() {
        const q = (el('#activitySearch')?.value || '').toLowerCase();
        const who = el('#activityUser')?.value || 'All';
        const tbody = el('#activityTable tbody');
        const users = await loadUsers();
        const logs = await loadActivityLogs();
        const list = logs
            .filter((a) =>
                (who === 'All' || String(a.UserID) === who) &&
                (!q ||
                    a.Action.toLowerCase().includes(q) 
            ))
            .sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));

        tbody.innerHTML = list
            .map(
                (a) => `
            <tr>
            <td>${escapeHtml(String(a.LogID))}</td>
            <td>${new Date(a.CreatedAt).toLocaleString()}</td>
            <td>${escapeHtml(a.Actor?.FullName ?? '')}</td>
            <td>${escapeHtml(a.Action)}</td>
            <td></td>
            </tr>`
            )
            .join('');
    }

    // ✅ Init
    ready(async () => {
        CURRENT_USER = await loadCurrentUser();

        if (!CURRENT_USER) {
            showToast('Not logged in', 'error');
            return;
        }

        renderUsers();
        renderActivity();

        // Tabs
        document.querySelectorAll('.tab').forEach((t) =>
            t.addEventListener('click', () => {
                const tab = t.dataset.tab;
                document.querySelectorAll('.tab').forEach((b) =>
                    b.classList.toggle('tab--active', b === t)
                );
                document.querySelectorAll('.tabpane').forEach((p) =>
                    p.classList.toggle('tabpane--active', p.dataset.pane === tab)
                );
            })
        );

        // Events
        el('#btnNewUser').addEventListener('click', openNew);
        if (CURRENT_USER.Role === 'Member') {
            el('#btnNewUser').style.display = 'none';
            el('#btnClearActivity').style.display = 'none';
        }
        el('#userForm').addEventListener('submit', saveUser);
        el('#btnDeleteUser').addEventListener('click', () => {
            delUser(el('#userId').value);
            closeModal();
        } 
        );
        document
            .querySelectorAll('#userModal [data-close]')
            .forEach((b) => b.addEventListener('click', closeModal));

        el('#userSearch').addEventListener('input', renderUsers);
        el('#roleFilter').addEventListener('change', renderUsers);

        el('#activitySearch').addEventListener('input', renderActivity);
        el('#activityUser').addEventListener('change', renderActivity);
    });
})();
