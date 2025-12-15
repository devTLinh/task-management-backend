// Tasks module: CRUD, history, comments, files (API-backed)
(function () {
    'use strict';

    const ready = (fn) =>
        document.readyState === 'loading'
            ? document.addEventListener('DOMContentLoaded', fn, { once: true })
            : fn();

    const el = (sel) => document.querySelector(sel);
    const nowIso = () => new Date().toISOString();
    const escapeHtml = (s = '') =>
        s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
    const prRank = (p) => ({ High: 3, Medium: 2, Low: 1 }[p] || 0);
    let tableSort = { by: 'priority', dir: 'desc' };

    // ---------- API WRAPPER ----------
    const api = {
        get: async (url) => {
            const res = await fetch(url, { credentials: 'include' });
            if (!res.ok) return null;
            return res.json();
        },
        post: async (url, data) => {
            const res = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) return null;
            return res.json();
        },
        put: async (url, data) => {
            const res = await fetch(url, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) return null;
            return res.json();
        },
        patch: async (url, data) => {
            const res = await fetch(url, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) return null;
            return res.json();
        },
        delete: async (url) => {
            const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
            return res.ok;
        },
    };

    // ---------- USER / ROLE ----------
    // Giả định server có /api/me trả về user hiện tại
    const getCurrentUser = async () => {
        const res = await api.get('/api/me');
        if (!res) return { name: 'User', userId: 0, role: 'Member' };
        return {
            name: res.FullName || res.UserName || 'User',
            userId: res.UserID,
            role: res.RoleName || 'Member',
        };
    };

    const roleRank = { Member: 1, Manager: 2, Admin: 3 };
    let currentUser = { name: 'User', userId: 0, role: 'Member' };
    const getRole = () => currentUser.role;
    const hasRole = (min) => (roleRank[getRole()] || 1) >= (roleRank[min] || 1);

    // ---------- DATA NORMALIZERS ----------
    const normalizeTask = (raw) => ({
        id: raw.TaskID,
        projectId: raw.ProjectID,
        title: raw.Title,
        description: raw.Description || '',
        dueDate: raw.DueDate || '',
        assignedTo: raw.AssignedToName || '',
        priority: raw.Priority || 'Medium',
        status: raw.Status || 'ToDo',
        createdAt: raw.CreatedAt,
        updatedAt: raw.UpdatedAt,
        order: raw.Order ?? 0,
    });

    const normalizeProject = (raw) => ({
        id: raw.ProjectID,
        name: raw.ProjectName,
    });

    const normalizeComment = (raw) => ({
        id: raw.CommentID,
        taskId: raw.TaskID,
        author: raw.User?.FullName || `User#${raw.UserID}`,
        text: raw.CommentText,
        createdAt: raw.CreatedAt,
        userId: raw.UserID,
    });

    const normalizeFile = (raw) => ({
        id: raw.FileID,
        taskId: raw.TaskID,
        fileName: raw.FileName,
        fileUrl: raw.FilePath,
        uploadedBy: raw.Uploader?.FullName || `User#${raw.UploadedBy}`,
        uploadedById: raw.UploadedBy,
        uploadedAt: raw.CreatedAt,
    });

    const normalizeHistory = (raw) => ({
        id: raw.HistoryID,
        taskId: raw.TaskID,
        changedBy: raw.Changer?.FullName || `User#${raw.ChangedBy}`,
        changedById: raw.ChangedBy,
        field: raw.ChangedField,
        oldValue: raw.OldValue,
        newValue: raw.NewValue,
        changedAt: raw.ChangedAt,
    });

    // ---------- API HELPERS ----------
    const fetchTasks = async () => {
        const res = await api.get('/api/get-all-tasks');
        if (!res) return [];
        const list = Array.isArray(res) ? res : res.data || [];
        console.log('Fetched tasks:', list);
        return list.map(normalizeTask);
    };

    const createTask = async (obj) => {
        const payload = {
            ProjectID: obj.projectId,
            Title: obj.title,
            Description: obj.description,
            DueDate: obj.dueDate,
            AssignedToName: obj.assignedTo,
            Priority: obj.priority,
            Status: obj.status,
        };
        const res = await api.post('/api/create-task', payload);
        return res ? normalizeTask(res) : null;
    };

    const updateTask = async (obj) => {
        const payload = {
            TaskID: obj.id,
            ProjectID: obj.projectId,
            Title: obj.title,
            Description: obj.description,
            DueDate: obj.dueDate,
            AssignedToName: obj.assignedTo,
            Priority: obj.priority,
            Status: obj.status,
            Order: obj.order ?? 0,
        };
        const res = await api.put('/update-task-by-id', payload);
        return res ? normalizeTask(res) : null;
    };

    const deleteTask = async (taskId) => {
        await api.delete(`/api/delete-task-by-id?TaskID=${encodeURIComponent(taskId)}`);
        // Xóa luôn history & files phía server (anh xử lý trong controller)
        await api.delete(`/api/delete-history-by-task-id?TaskID=${encodeURIComponent(taskId)}`);
        await api.delete(`/api/delete-files-by-task-id?TaskID=${encodeURIComponent(taskId)}`);
    };

    const changeTaskStatus = async (taskId, newStatus, newOrder) => {
        await api.patch('/api/change-status-task-by-id', {
            TaskID: taskId,
            Status: newStatus,
            Order: newOrder,
        });
    };

    const fetchProjects = async () => {
        const res = await api.get('/api/get-all-projects');
        const list = Array.isArray(res) ? res : res.projects || [];
        return list.map(normalizeProject);
    };

    const fetchComments = async (taskId) => {
        const res = await api.get(`/api/get-all-comments-or-userId?TaskID=${encodeURIComponent(taskId)}`);
        const list = Array.isArray(res) ? res : res.data || [];
        return list.map(normalizeComment);
    };

    const createComment = async (taskId, text) => {
        await api.post('/api/create-comment', {
            TaskID: taskId,
            CommentText: text,
        });
    };

    const deleteComment = async (commentId) => {
        await api.delete(`/api/delete-comment-by-id?CommentID=${encodeURIComponent(commentId)}`);
    };

    const fetchFiles = async (taskId) => {
        const res = await api.get(`/api/get-files-by-task-id?TaskID=${encodeURIComponent(taskId)}`);
        const list = Array.isArray(res) ? res : res.data || [];
        return list.map(normalizeFile);
    };

    const uploadFile = async (taskId, file) => {
        const formData = new FormData();
        formData.append('TaskID', taskId);
        formData.append('file', file);
        const res = await fetch('/api/upload-file', {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });
        if (!res.ok) return null;
        const data = await res.json();
        return normalizeFile(data);
    };

    const deleteFileApi = async (fileId) => {
        await api.delete(`/api/delete-file-by-id?FileID=${encodeURIComponent(fileId)}`);
    };

    const fetchHistory = async (taskId) => {
        const res = await api.get(`/api/get-history-by-task-id?TaskID=${encodeURIComponent(taskId)}`);
        const list = Array.isArray(res) ? res : res.data || [];
        return list.map(normalizeHistory);
    };

    const createHistory = async (taskId, field, oldValue, newValue) => {
        await api.post('/api/create-task-history', {
            TaskID: taskId,
            ChangedField: field,
            OldValue: oldValue,
            NewValue: newValue,
        });
    };

    // ---------- PROJECT NAME HELPER ----------
    let projectsCache = [];
    const getProjectName = (id) => {
        const p = projectsCache.find((x) => x.id === id);
        return p ? p.name : '';
    };

    const statusClass = (s) => ({
        ToDo: 'status--todo',
        InProgress: 'status--inprogress',
        InReview: 'status--review',
        Done: 'status--done',
        Blocked: 'status--blocked'
    }[s] || 'status--todo');


    const renderProjectsSelect = (selectEl) => {
        if (!selectEl) return;
        selectEl.innerHTML = projectsCache
            .map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`)
            .join('');
    };

    const renderAssigneesSelect = (projectId, selectedName = '') => {
        const sel = el('#taskAssignee');
        if (!sel) return;
        // Tạm thời: assignee là free-text; nếu sau này anh có API projectMembers thì map từ đó
        const opts = [
            '<option value="">Unassigned</option>',
            selectedName ? `<option value="${escapeHtml(selectedName)}" selected>${escapeHtml(selectedName)}</option>` : '',
        ].filter(Boolean);
        sel.innerHTML = opts.join('');
    };

    // ---------- STATE CACHE ----------
    let tasksCache = [];

    // ---------- RENDER TABLE ----------
    const renderTable = () => {
        const q = (el('#taskSearch').value || '').trim().toLowerCase();
        const st = el('#taskStatus').value;
        const pr = el('#taskPriority').value;
        const tbody = el('#taskTbody');

        const tasks = tasksCache
            .filter(
                (t) =>
                    (st === 'all' || t.status === st) &&
                    (pr === 'all' || t.priority === pr) &&
                    (!q ||
                        (t.title || '').toLowerCase().includes(q) ||
                        (t.assignedTo || '').toLowerCase().includes(q)),
            )
            .sort((a, b) => {
                if (tableSort.by === 'priority') {
                    const cmp = prRank(a.priority) - prRank(b.priority);
                    return tableSort.dir === 'asc' ? cmp : -cmp;
                }
                return 0;
            });

        tbody.innerHTML = tasks
            .map((t) => {
                const cls = statusClass(t.status);
                const tagClass =
                    t.priority === 'High' ? 'tag tag--warn' : t.priority === 'Low' ? 'tag tag--ok' : 'tag';
                const projName = escapeHtml(getProjectName(t.projectId) || '-');
                return `<tr data-id="${t.id}">
          <td>${escapeHtml(t.title)}</td>
          <td>${projName}</td>
          <td>${escapeHtml(t.assignedTo || '')}</td>
          <td>${escapeHtml(t.dueDate || '')}</td>
          <td><span class="${tagClass}">${escapeHtml(t.priority || '')}</span></td>
          <td><span class="status ${cls}">${escapeHtml(
                    t.status.replace(/([A-Z])/g, ' $1').trim(),
                )}</span></td>
        </tr>`;
            })
            .join('');

        tbody.querySelectorAll('tr').forEach((tr) =>
            tr.addEventListener('click', () => openEdit(tr.dataset.id)),
        );
    };

    // ---------- RENDER BOARD ----------
    const renderBoard = () => {
        const q = (el('#taskSearch').value || '').trim().toLowerCase();
        const st = el('#taskStatus').value;
        const pr = el('#taskPriority').value;

        const tasks = tasksCache
            .filter(
                (t) =>
                    (st === 'all' || t.status === st) &&
                    (pr === 'all' || t.priority === pr) &&
                    (!q ||
                        (t.title || '').toLowerCase().includes(q) ||
                        (t.assignedTo || '').toLowerCase().includes(q)),
            )
            .sort((a, b) => {
                if (a.status === b.status) {
                    if ((a.projectId || '') === (b.projectId || '')) {
                        const cmpPr = prRank(b.priority) - prRank(a.priority);
                        if (cmpPr !== 0) return cmpPr;
                    }
                    return (a.order ?? 0) - (b.order ?? 0);
                }
                return 0;
            });

        const cols = {
            ToDo: 'col-todo',
            InProgress: 'col-inprogress',
            InReview: 'col-review',
            Done: 'col-done',
            Blocked: 'col-blocked'
        };
        Object.values(cols).forEach((id) => {
            const c = el('#' + id);
            if (c) c.innerHTML = '';
        });

        tasks.forEach((t) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.draggable = true;
            card.dataset.id = t.id;
            card.dataset.project = t.projectId || '';
            const projName = escapeHtml(getProjectName(t.projectId) || '-');
            card.innerHTML = `<div class="card__title">${escapeHtml(
                t.title,
            )}</div><div class="card__meta"><span class="tag"><i class="fa-regular fa-folder"></i>${projName}</span><span class="tag">${escapeHtml(
                t.assignedTo || '',
            )}</span><span class="tag">${escapeHtml(t.priority || '')}</span><span class="tag">${escapeHtml(
                t.dueDate || '',
            )}</span></div>`;
            const container = el('#' + cols[t.status]) || el('#col-todo');
            container && container.appendChild(card);

            card.addEventListener('dblclick', () => openEdit(t.id));
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', t.id);
                card.classList.add('dragging');
            });
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
        });

        const getDragAfterElement = (container, y, projectId) => {
            const els = [...container.querySelectorAll('.card:not(.dragging)')].filter(
                (el) => (el.dataset.project || '') === (projectId || ''),
            );
            const MARGIN = 4;
            return els.reduce(
                (closest, child) => {
                    const box = child.getBoundingClientRect();
                    const offset = y - (box.top + box.height / 2);
                    if (offset < -MARGIN && offset > closest.offset) {
                        return { offset, element: child };
                    }
                    return closest;
                },
                { offset: Number.NEGATIVE_INFINITY },
            ).element;
        };

        document.querySelectorAll('.board--tasks .board__list').forEach((list) => {
            let raf = null;
            let lastY = 0;

            list.addEventListener('dragover', (e) => {
                e.preventDefault();
                list.classList.add('drag-over');
                lastY = e.clientY;
                if (raf) return;
                raf = requestAnimationFrame(() => {
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
                    } else if (
                        after !== dragging.nextElementSibling ||
                        dragging.parentElement !== list
                    ) {
                        list.insertBefore(dragging, after);
                    }
                });
            });

            list.addEventListener('dragleave', () => list.classList.remove('drag-over'));

            list.addEventListener('drop', async (e) => {
                e.preventDefault();
                list.classList.remove('drag-over');
                const id = e.dataTransfer.getData('text/plain');
                if (!id) return;
                const statusMap = {
                    'col-todo': 'ToDo',
                    'col-inprogress': 'InProgress',
                    'col-review': 'InReview',
                    'col-done': 'Done',
                    'col-blocked': 'Blocked'
                };
                const newStatus = statusMap[list.id];
                if (!newStatus) return;

                const t = tasksCache.find((x) => String(x.id) === String(id));
                if (!t) return;

                if (!hasRole('Manager')) {
                    if ((t.assignedTo || '').trim() !== currentUser.name.trim()) {
                        window.showToast &&
                            showToast('You can only move your assigned tasks', 'error');
                        return;
                    }
                }

                const oldStatus = t.status;
                t.status = newStatus;

                const dragging = document.querySelector('.card.dragging');
                if (dragging && dragging.parentElement !== list) list.appendChild(dragging);

                const ids = [...list.querySelectorAll('.card')].map((x) => x.dataset.id);
                ids.forEach((tid, idx) => {
                    const task = tasksCache.find((x) => String(x.id) === String(tid));
                    if (task) task.order = idx;
                });

                await changeTaskStatus(t.id, newStatus, t.order);

                if (oldStatus !== newStatus) {
                    await createHistory(t.id, 'status', oldStatus, newStatus);
                    window.showToast && showToast('Status changed', 'info');
                }

                renderBoard();
            });
        });
    };

    const renderAll = () => {
        renderTable();
        renderBoard();
    };

    const switchTab = (tab) => {
        document
            .querySelectorAll('.tab')
            .forEach((b) => b.classList.toggle('tab--active', b.dataset.tab === tab));
        document
            .querySelectorAll('.tabpane')
            .forEach((p) => p.classList.toggle('tabpane--active', p.dataset.pane === tab));
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

    // ---------- COMMENTS / FILES / HISTORY RENDER ----------
    const loadCommentsUI = async (taskId) => {
        const list = await fetchComments(taskId);
        const ul = el('#commentList');
        ul.innerHTML = list
            .map(
                (c) =>
                    `<li class="comment" data-id="${c.id}">
            <div>
              <div class="comment__meta">${escapeHtml(c.author)} • ${new Date(
                        c.createdAt,
                    ).toLocaleString()}</div>
              <div class="comment__text">${escapeHtml(c.text)}</div>
            </div>
            <div class="comment__actions">${c.userId === currentUser.userId
                        ? '<button data-del>Delete</button>'
                        : ''
                    }</div>
          </li>`,
            )
            .join('');

        ul.querySelectorAll('button[data-del]').forEach((btn) =>
            btn.addEventListener('click', async () => {
                const id = btn.closest('.comment').dataset.id;
                await deleteComment(id);
                await loadCommentsUI(taskId);
            }),
        );
    };

    const loadFilesUI = async (taskId) => {
        const list = await fetchFiles(taskId);
        const ul = el('#fileList');
        ul.innerHTML = list
            .map(
                (f) =>
                    `<li class="files__item" data-id="${f.id}">
            <div>
              <a href="${escapeHtml(f.fileUrl)}" download="${escapeHtml(
                        f.fileName,
                    )}">${escapeHtml(f.fileName)}</a>
              <div class="subtle">${escapeHtml(
                        f.uploadedBy,
                    )} • ${new Date(f.uploadedAt).toLocaleString()}</div>
            </div>
            <div class="files__actions">${f.uploadedById === currentUser.userId
                        ? '<button data-del>Delete</button>'
                        : ''
                    }</div>
          </li>`,
            )
            .join('');

        ul.querySelectorAll('button[data-del]').forEach((btn) =>
            btn.addEventListener('click', async () => {
                const id = btn.closest('.files__item').dataset.id;
                await deleteFileApi(id);
                await loadFilesUI(taskId);
            }),
        );
    };

    const loadHistoryUI = async (taskId) => {
        const list = await fetchHistory(taskId);
        const tbody = el('#historyTable tbody');
        tbody.innerHTML = list
            .map(
                (h) =>
                    `<tr>
            <td>${new Date(h.changedAt).toLocaleString()}</td>
            <td>${escapeHtml(h.changedBy)}</td>
            <td>${escapeHtml(h.field)}</td>
            <td>${escapeHtml(String(h.oldValue || ''))}</td>
            <td>${escapeHtml(String(h.newValue || ''))}</td>
          </tr>`,
            )
            .join('');
    };

    // ---------- OPEN EDIT ----------
    const openEdit = async (id) => {
        const t = tasksCache.find((x) => String(x.id) === String(id));
        el('#taskModalTitle').textContent = t ? 'Edit task' : 'New task';
        switchTab('task-info');
        resetForm();

        if (t) {
            el('#taskId').value = t.id;
            renderProjectsSelect(el('#taskProject'));
            el('#taskProject').value = t.projectId || '';
            renderAssigneesSelect(el('#taskProject').value, t.assignedTo || '');
            el('#taskTitle').value = t.title || '';
            el('#taskDesc').value = t.description || '';
            el('#taskDue').value = t.dueDate || '';
            el('#taskAssignee').value = t.assignedTo || '';
            el('#taskPrioritySelect').value = t.priority || 'Medium';
            el('#taskStatusSelect').value = t.status || 'Todo';

            await loadCommentsUI(t.id);
            await loadFilesUI(t.id);
            await loadHistoryUI(t.id);
        } else {
            renderProjectsSelect(el('#taskProject'));
            renderAssigneesSelect(el('#taskProject').value, '');
        }
        showModal();
    };

    // ---------- RECORD HISTORY CHANGES ----------
    const recordHistoryChanges = async (oldObj, newObj) => {
        const fields = ['title', 'description', 'dueDate', 'assignedTo', 'priority', 'status', 'projectId'];
        const changes = [];
        fields.forEach((f) => {
            const oldVal = oldObj ? oldObj[f] : undefined;
            const newVal = newObj[f];
            if (oldObj && oldVal === newVal) return;
            if (!oldObj && (newVal === undefined || newVal === '')) return;
            changes.push({ field: f, oldValue: oldVal, newValue: newVal });
        });
        if (!changes.length) return;
        for (const c of changes) {
            await createHistory(newObj.id, c.field, c.oldValue, c.newValue);
        }
    };

    // ---------- INIT ----------
    ready(async () => {
        currentUser = await getCurrentUser();
        projectsCache = await fetchProjects();
        tasksCache = await fetchTasks();

        const search = el('#taskSearch');
        const filtStatus = el('#taskStatus');
        const filtPriority = el('#taskPriority');
        const btnNew = el('#btnNewTask');

        renderAll();

        const thPr = document.getElementById('thPriority');
        if (thPr) {
            const setLabel = () => {
                thPr.textContent = `Priority ${tableSort.dir === 'asc' ? '▲' : '▼'}`;
            };
            setLabel();
            thPr.addEventListener('click', () => {
                tableSort.dir = tableSort.dir === 'asc' ? 'desc' : 'asc';
                renderTable();
                setLabel();
            });
        }

        [search, filtStatus, filtPriority].forEach((c) =>
            c.addEventListener('input', () => renderAll()),
        );
        [filtStatus, filtPriority].forEach((sel) =>
            sel.addEventListener('change', () => renderAll()),
        );

        const canManage = hasRole('Manager');
        if (!canManage && btnNew) {
            btnNew.style.display = 'none';
        }

        btnNew &&
            btnNew.addEventListener('click', () => {
                if (!canManage) {
                    window.showToast &&
                        showToast('Only Manager or Admin can create tasks', 'error');
                    return;
                }
                resetForm();
                el('#taskModalTitle').textContent = 'New task';
                showModal();
            });

        const viewTableBtn = document.getElementById('viewTable');
        const viewBoardBtn = document.getElementById('viewBoard');
        const tableEl = document.getElementById('taskTable');
        const boardEl = document.getElementById('taskBoard');
        const projSel = el('#taskProject');

        projSel &&
            projSel.addEventListener('change', () =>
                renderAssigneesSelect(projSel.value, ''),
            );

        const setView = (board) => {
            if (board) {
                tableEl.hidden = true;
                boardEl.hidden = false;
                viewBoardBtn.classList.add('view-toggle__btn--active');
                viewBoardBtn.setAttribute('aria-selected', 'true');
                viewTableBtn.classList.remove('view-toggle__btn--active');
                viewTableBtn.setAttribute('aria-selected', 'false');
                renderBoard();
            } else {
                tableEl.hidden = false;
                boardEl.hidden = true;
                viewTableBtn.classList.add('view-toggle__btn--active');
                viewTableBtn.setAttribute('aria-selected', 'true');
                viewBoardBtn.classList.remove('view-toggle__btn--active');
                viewBoardBtn.setAttribute('aria-selected', 'false');
                renderTable();
            }
        };

        viewTableBtn && viewTableBtn.addEventListener('click', () => setView(false));
        viewBoardBtn && viewBoardBtn.addEventListener('click', () => setView(true));

        document
            .querySelectorAll('#taskModal [data-close]')
            .forEach((b) => b.addEventListener('click', () => hideModal()));
        document
            .querySelectorAll('#taskModal .tab')
            .forEach((t) => t.addEventListener('click', () => switchTab(t.dataset.tab)));

        const form = el('#taskForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const idStr = el('#taskId').value;
            const isEdit = !!idStr;
            const projectId = el('#taskProject').value;
            const obj = {
                id: isEdit ? Number(idStr) : undefined,
                projectId: projectId ? Number(projectId) : null,
                title: el('#taskTitle').value.trim(),
                description: el('#taskDesc').value.trim(),
                dueDate: el('#taskDue').value,
                assignedTo: el('#taskAssignee').value.trim(),
                priority: el('#taskPrioritySelect').value,
                status: el('#taskStatusSelect').value,
            };
            if (!obj.title) {
                el('#taskTitle').focus();
                window.showToast &&
                    showToast('Task title is required', 'warning');
                return;
            }

            const existing = isEdit
                ? tasksCache.find((x) => String(x.id) === String(obj.id))
                : null;

            if (existing) {
                if (!hasRole('Manager')) {
                    if ((existing.assignedTo || '').trim() !== currentUser.name.trim()) {
                        window.showToast &&
                            showToast('You can only edit your assigned tasks', 'error');
                        return;
                    }
                }
                await recordHistoryChanges(existing, { ...existing, ...obj, id: existing.id });
                const updated = await updateTask({ ...existing, ...obj, id: existing.id });
                if (updated) {
                    const idx = tasksCache.findIndex((t) => t.id === updated.id);
                    if (idx !== -1) tasksCache[idx] = updated;
                }
                window.showToast && showToast('Task updated', 'success');
            } else {
                if (!hasRole('Manager')) {
                    window.showToast &&
                        showToast('Only Manager or Admin can create tasks', 'error');
                    return;
                }
                const created = await createTask(obj);
                if (created) {
                    await recordHistoryChanges(null, created);
                    tasksCache.push(created);
                }
                window.showToast && showToast('Task created', 'success');
            }

            hideModal();
            renderAll();
        });

        el('#btnDeleteTask').addEventListener('click', async () => {
            if (!hasRole('Manager')) {
                window.showToast &&
                    showToast('Only Manager or Admin can delete tasks', 'error');
                return;
            }
            const idStr = el('#taskId').value;
            if (!idStr) {
                hideModal();
                return;
            }
            const taskId = Number(idStr);
            await deleteTask(taskId);
            tasksCache = tasksCache.filter((t) => t.id !== taskId);
            hideModal();
            window.showToast && showToast('Task deleted', 'success');
            renderAll();
        });

        el('#btnAddComment').addEventListener('click', async () => {
            const taskIdStr = el('#taskId').value;
            if (!taskIdStr) return;
            const taskId = Number(taskIdStr);
            const text = el('#commentText').value.trim();
            if (!text) {
                el('#commentText').focus();
                window.showToast &&
                    showToast('Comment cannot be empty', 'warning');
                return;
            }
            await createComment(taskId, text);
            el('#commentText').value = '';
            await loadCommentsUI(taskId);
            window.showToast && showToast('Comment added', 'success');
        });

        el('#btnUploadFile').addEventListener('click', async () => {
            const taskIdStr = el('#taskId').value;
            if (!taskIdStr) return;
            const taskId = Number(taskIdStr);
            const input = el('#fileInput');
            const file = input.files && input.files[0];
            if (!file) {
                window.showToast &&
                    showToast('Please choose a file', 'warning');
                return;
            }
            await uploadFile(taskId, file);
            input.value = '';
            await loadFilesUI(taskId);
            window.showToast && showToast('File uploaded', 'success');
        });
    });
})();
