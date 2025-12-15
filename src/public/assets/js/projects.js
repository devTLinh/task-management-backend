(function () {
    'use strict';

    const ready = (fn) =>
        document.readyState === 'loading'
            ? document.addEventListener('DOMContentLoaded', fn, { once: true })
            : fn();

    // ✅ STATUS CHUẨN BACKEND
    const statuses = ['Pending', 'InProgress', 'Completed', 'Cancelled'];

    const el = (sel) => document.querySelector(sel);
    const col = (key) => el(`#col-${key}`);
    const escapeHtml = (s = '') =>
        s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));

    // -----------------------------
    // ✅ API HELPERS
    // -----------------------------
    async function apiGetMe() {
        const res = await fetch('/api/me', { credentials: 'include' });
        return await res.json();
    }

    async function apiGetAllProjects() {
        const res = await fetch('/api/get-all-projects', { credentials: 'include' });
        return await res.json();
    }

    async function apiGetProject(id) {
        const res = await fetch(`/api/get-project-by-id?id=${encodeURIComponent(id)}`, {
            credentials: 'include'
        });
        return await res.json();
    }

    async function apiCreateProject(payload) {
        const res = await fetch('/api/create-project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        return await res.json();
    }

    async function apiEditProject(payload) {
        const res = await fetch('/api/edit-project', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        return await res.json();
    }

    async function apiUpdateStatus(id, status, order) {
        const res = await fetch('/api/update-status-project', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                projectId: id,
                status: status,
                order: order
            })
        });
        return await res.json();
    }

    async function apiDeleteProject(id) {
        const res = await fetch(`/api/delete-project-by-id?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        return await res.json();
    }

    async function apiCreateProjectMember(payload) {
        const res = await fetch('/api/create-project-member', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        return await res.json();
    }

    // -----------------------------
    // ✅ UI HELPERS
    // -----------------------------
    const showModal = () => el('#projectModal').classList.add('show');
    const hideModal = () => el('#projectModal').classList.remove('show');

    const resetForm = () => {
        el('#projId').value = '';
        el('#projName').value = '';
        el('#projDesc').value = '';
        el('#projStart').value = '';
        el('#projEnd').value = '';
        el('#projStatus').value = 'Pending';
        el('#memberTable tbody').innerHTML = '';
    };

    const switchTab = (tab) => {
        document.querySelectorAll('.tab').forEach((b) =>
            b.classList.toggle('tab--active', b.dataset.tab === tab)
        );
        document.querySelectorAll('.tabpane').forEach((p) =>
            p.classList.toggle('tabpane--active', p.dataset.pane === tab)
        );
    };

    function renderMembers(members = []) {
        const tbody = el('#memberTable tbody');
        tbody.innerHTML = '';

        members.forEach((m) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td>${escapeHtml(m.UserName || '')}</td>
        <td>${escapeHtml(m.ProjectMember?.Role || '')}</td>
        <td>${m.ProjectMember?.JoinedAt ? new Date(m.ProjectMember.JoinedAt).toLocaleString() : ''}</td>
      `;
            tbody.appendChild(tr);
        });
    }

    // -----------------------------
    // ✅ RENDER BOARD
    // -----------------------------
    async function render() {
        const filterType = el('#filterType').value;
        const data = await apiGetAllProjects();
        const list = data.projects || [];

        statuses.forEach((k) => {
            const c = col(k);
            if (c) c.innerHTML = '';
        });

        list
            .filter((p) => (filterType === 'all' ? true : (p.Type || '').toLowerCase() === filterType))
            .forEach((p) => {
                const card = document.createElement('div');
                card.className = 'card';
                card.dataset.id = p.ProjectID;
                card.setAttribute('draggable', 'true');

                card.innerHTML = `
          <div class="card__title">${escapeHtml(p.Name)}</div>
          <div class="card__meta">
            <span class="badge badge--team">${escapeHtml(p.Type || 'team')}</span>
            ${p.Creator ? `<span class="tag"><i class="fa-regular fa-user"></i>${escapeHtml(p.Creator.UserName)}</span>` : ''}
          </div>
        `;

                const container = col(p.Status) || col('Pending');
                container.appendChild(card);
            });

        setupCardEvents();
        setupDragDrop();
    }

    function setupCardEvents() {
        document.querySelectorAll('.card').forEach((card) => {
            card.addEventListener('dblclick', () => openEdit(card.dataset.id));
        });
    }

    // -----------------------------
    // ✅ DRAG & DROP
    // -----------------------------
    function setupDragDrop() {
        document.querySelectorAll('.card').forEach((card) => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.dataset.id);
                card.classList.add('dragging');
            });
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
        });

        statuses.forEach((st) => {
            const listEl = col(st);
            if (!listEl) return;

            listEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                listEl.classList.add('drag-over');
            });

            listEl.addEventListener('dragleave', () => listEl.classList.remove('drag-over'));

            listEl.addEventListener('drop', async (e) => {
                e.preventDefault();
                listEl.classList.remove('drag-over');

                const id = e.dataTransfer.getData('text/plain');
                if (!id) return;

                const cards = [...listEl.querySelectorAll('.card')].filter(
                    (c) => c.dataset.id !== id
                );
                const order = cards.length;

                const result = await apiUpdateStatus(id, st, order);
                if (result.errorCode === 0) {
                    showToast('Status updated', 'success');
                    render();
                } else {
                    showToast(result.errorMessage || 'Failed to update', 'error');
                }
            });
        });
    }

    // -----------------------------
    // ✅ OPEN EDIT
    // -----------------------------
    async function openEdit(id) {
        const data = await apiGetProject(id);
        const p = data.project;
        if (!p) return;

        el('#modalTitle').textContent = 'Edit project';
        el('#projId').value = p.ProjectID;
        el('#projName').value = p.Name || '';
        el('#projDesc').value = p.Description || '';
        el('#projStart').value = p.StartDate || '';
        el('#projEnd').value = p.EndDate || '';
        el('#projStatus').value = p.Status || 'Pending';

        renderMembers(p.Members || []);

        switchTab('info');
        showModal();
    }

    // -----------------------------
    // ✅ SAVE PROJECT
    // -----------------------------
    async function saveProject(e) {
        e.preventDefault();

        const id = el('#projId').value;

        const payload = {
            name: el('#projName').value.trim(),
            description: el('#projDesc').value.trim(),
            startDate: el('#projStart').value,
            endDate: el('#projEnd').value,
            status: el('#projStatus').value,
            createdBy: window.currentUserId   // ✅ LẤY TỪ /api/me
        };

        let result = id
            ? await apiEditProject({ projectId: id, ...payload })
            : await apiCreateProject(payload);

        if (result.errorCode === 0) {
            showToast(id ? 'Project updated' : 'Project created', 'success');
            hideModal();
            resetForm();
            render();
        } else {
            showToast(result.errorMessage || 'Save failed', 'error');
        }
    }

    // -----------------------------
    // ✅ DELETE PROJECT
    // -----------------------------
    async function deleteProject() {
        const id = el('#projId').value;
        if (!id) return;

        const result = await apiDeleteProject(id);
        if (result.errorCode === 0) {
            showToast('Project deleted', 'success');
            hideModal();
            resetForm();
            render();
        } else {
            showToast(result.errorMessage || 'Delete failed', 'error');
        }
    }

    // -----------------------------
    // ✅ ADD MEMBER
    // -----------------------------
    async function addMember() {
        const projectId = el('#projId').value;
        if (!projectId) {
            showToast('Save project first', 'warning');
            return;
        }

        const userId = Number(el('#memberUserId').value);
        const role = el('#memberRole').value;

        if (!userId) {
            showToast('User ID is required', 'warning');
            return;
        }

        const payload = {
            projectId: Number(projectId),
            userId: userId,
            role: role,
            joinedAt: new Date().toISOString()
        };

        const result = await apiCreateProjectMember(payload);

        if (result.errorCode === 0) {
            showToast('Member added', 'success');

            const data = await apiGetProject(projectId);
            renderMembers(data.project.Members || []);
            render();
        } else {
            showToast(result.errorMessage || 'Failed to add member', 'error');
        }
    }

    // -----------------------------
    // ✅ INIT
    // -----------------------------
    ready(async () => {
        // ✅ LẤY USER HIỆN TẠI TỪ /api/me
        const me = await apiGetMe();
        if (me.errorCode === 0 && me.user) {
            window.currentUserId = me.user.UserID;
        } else {
            showToast("Cannot get user info", "error");
            window.currentUserId = null;
        }

        render();

        el('#filterType').addEventListener('change', render);

        el('#btnNewProject').addEventListener('click', () => {
            resetForm();
            el('#modalTitle').textContent = 'Create new project';
            switchTab('info');
            showModal();
        });

        document.querySelectorAll('.tab').forEach((t) =>
            t.addEventListener('click', () => switchTab(t.dataset.tab))
        );

        document.querySelectorAll('#projectModal [data-close]').forEach((b) =>
            b.addEventListener('click', hideModal)
        );

        el('#projectForm').addEventListener('submit', saveProject);
        el('#btnDeleteProject').addEventListener('click', deleteProject);
        el('#btnAddMember').addEventListener('click', addMember);
    });
})();
