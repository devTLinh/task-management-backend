// Reports: compute KPIs and tables using backend API instead of localStorage
(function () {
    'use strict';

    const ready = (fn) =>
        document.readyState === 'loading'
            ? document.addEventListener('DOMContentLoaded', fn, { once: true })
            : fn();

    const escapeHtml = (s = '') =>
        s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));

    const daysBetween = (a, b) =>
        Math.max(0, (new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));

    // ✅ API helpers
    async function api(url) {
        try {
            const res = await fetch(url, { credentials: 'include' });
            return await res.json();
        } catch (err) {
            console.error("API error:", err);
            return { errorCode: 500, data: [] };
        }
    }

    ready(async () => {
        // ✅ Load data from backend
        const tasksRes = await api('/api/get-all-tasks');
        const projectsRes = await api('/api/get-all-projects');
        const commentsRes = await api('/api/get-all-comments-or-userId');
        //const filesRes = await api('/api/get-all-files');
        const historyRes = await api('/api/get-task-history');

        const tasks = tasksRes.tasks || [];
        const projects = projectsRes.projects || [];
        const comments = commentsRes.comments || [];
        //const files = filesRes.files || [];
        const history = historyRes.history || [];

        // ✅ KPIs
        const open = tasks.filter((t) => t.Status !== 'Done').length;
        const done = tasks.filter((t) => t.Status === 'Done').length;

        // ✅ Average completion time
        const avg = (() => {
            const completed = tasks.filter((t) => t.Status === 'Done');
            if (!completed.length) return 0;

            let sum = 0,
                n = 0;

            completed.forEach((t) => {
                const h = history.find(
                    (h) =>
                        h.TaskID === t.TaskID &&
                        h.ChangedField === 'Status' &&
                        h.NewValue === 'Done'
                );

                const end = h ? h.ChangedAt : t.UpdatedAt || t.CreatedAt;
                const start = t.CreatedAt || t.UpdatedAt || end;

                if (end && start) {
                    sum += daysBetween(start, end);
                    n++;
                }
            });

            return n ? sum / n : 0;
        })();

        const activeProjects = projects.filter(
            (p) => p.Status === 'Pending' || p.Status === 'InProgress'
        ).length;

        const setText = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.textContent = v;
        };

        setText('kpiOpen', open);
        setText('kpiDone', done);
        setText('kpiAvg', avg.toFixed(1));
        setText('kpiActive', activeProjects);

        // ✅ Status breakdown
        const statusCounts = tasks.reduce((acc, t) => {
            acc[t.Status] = (acc[t.Status] || 0) + 1;
            return acc;
        }, {});

        const sb = document.getElementById('statusBreakdown');
        if (sb) {
            const order = ['Todo', 'InProgress', 'Review', 'Done'];
            const cls = {
                Todo: 'status status--todo',
                InProgress: 'status status--inprogress',
                Review: 'status status--review',
                Done: 'status status--done',
            };

            sb.innerHTML = order
                .map(
                    (s) =>
                        `<span class="${cls[s]}">${s.replace(/([A-Z])/g, ' $1').trim()}</span> ${statusCounts[s] || 0
                        }`
                )
                .join(' • ');
        }

        // ✅ Activity totals
        const activity = document.getElementById('activityTotals');
        if (activity) {
            const active = projects.filter(
                (p) => p.Status === 'Pending' || p.Status === 'InProgress'
            ).length;
            const completedProj = projects.filter((p) => p.Status === 'Completed').length;
            activity.textContent = `Comments: ${comments.length} • Active projects: ${active} • Completed projects: ${completedProj}`;
            //activity.textContent = `Comments: ${comments.length} • Files: ${files.length} • Active projects: ${active} • Completed projects: ${completedProj}`;
        }

        // ✅ Project progress table
        const tbodyProj = document.querySelector('#projectTable tbody');
        if (tbodyProj) {
            const rows = projects
                .map((p) => {
                    const ptasks = tasks.filter((t) => t.ProjectID === p.ProjectID);
                    const d = ptasks.filter((t) => t.Status === 'Done').length;
                    const total = ptasks.length;
                    const pct = total ? Math.round((d / total) * 100) : 0;

                    return `<tr>
            <td>${escapeHtml(p.Name || '(unnamed)')}</td>
            <td>${d}</td>
            <td>${total}</td>
            <td>${pct}%</td>
          </tr>`;
                })
                .join('');

            tbodyProj.innerHTML =
                rows || '<tr><td colspan="4" class="subtle">No projects</td></tr>';
        }

        // ✅ Assignee table
        const tbodyAsg = document.querySelector('#assigneeTable tbody');
        if (tbodyAsg) {
            const map = tasks.reduce((acc, t) => {
                const a = (t.AssignedTo || 'Unassigned').trim() || 'Unassigned';
                acc[a] = (acc[a] || 0) + 1;
                return acc;
            }, {});

            const rows = Object.entries(map)
                .sort((a, b) => b[1] - a[1])
                .map(
                    ([name, count]) =>
                        `<tr><td>${escapeHtml(name)}</td><td>${count}</td></tr>`
                )
                .join('');

            tbodyAsg.innerHTML =
                rows || '<tr><td colspan="2" class="subtle">No tasks</td></tr>';
        }
    });
})();
