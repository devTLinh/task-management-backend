// Reports: compute KPIs and simple tables from localStorage
(function(){
  'use strict';
  const ready = (fn)=> document.readyState==='loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();
  const load = (k)=>{ try { return JSON.parse(localStorage.getItem(k)||'[]'); } catch { return []; } };
  const escapeHtml = (s='')=> s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]||c));
  const daysBetween = (a,b)=> Math.max(0, (new Date(b)-new Date(a)) / (1000*60*60*24));

  ready(()=>{
    const tasks = load('tm.tasks');
    const projects = load('tm.projects');
    const comments = load('tm.comments');
    const files = load('tm.files');
    const history = load('tm.taskHistory');

    // KPIs
    const isOpen = (t)=> t.status !== 'Done';
    const open = tasks.filter(isOpen).length;
    const done = tasks.filter(t=> t.status === 'Done').length;
    const avg = (()=>{
      const completed = tasks.filter(t=> t.status === 'Done');
      if (!completed.length) return 0;
      let sum=0, n=0;
      completed.forEach(t=>{
        // find when status became Done in history
        const h = history.find(h=> h.taskId===t.id && h.changedField==='status' && h.newValue==='Done');
        const end = h ? h.changedAt : (t.updatedAt || t.createdAt);
        const start = t.createdAt || t.updatedAt || end;
        if (end && start) { sum += daysBetween(start, end); n++; }
      });
      return n? (sum/n).toFixed(1) : 0;
    })();
    const activeProjects = projects.filter(p=> p.status==='planning' || p.status==='inprogress').length;
    const setText = (id,v)=>{ const el = document.getElementById(id); if (el) el.textContent = v; };
    setText('kpiOpen', open);
    setText('kpiDone', done);
    setText('kpiAvg', avg);
    setText('kpiActive', activeProjects);

    // Status breakdown
    const statusCounts = tasks.reduce((acc,t)=>{ acc[t.status]=(acc[t.status]||0)+1; return acc; },{});
    const sb = document.getElementById('statusBreakdown');
    if (sb) {
      const order = ['Todo','InProgress','Review','Done'];
      const cls = {Todo:'status status--todo', InProgress:'status status--inprogress', Review:'status status--review', Done:'status status--done'};
      sb.innerHTML = order.map(s=>`<span class="${cls[s]}">${s.replace(/([A-Z])/g,' $1').trim()}</span> ${statusCounts[s]||0}`).join(' • ');
    }

    // Activity totals
    const activity = document.getElementById('activityTotals');
    if (activity) {
      const active = projects.filter(p=> p.status==='planning'||p.status==='inprogress').length;
      const completedProj = projects.filter(p=> p.status==='completed').length;
      activity.textContent = `Comments: ${comments.length} • Files: ${files.length} • Active projects: ${active} • Completed projects: ${completedProj}`;
    }

    // Project progress table
    const tbodyProj = document.querySelector('#projectTable tbody');
    if (tbodyProj) {
      const rows = projects.map(p=>{
        const ptasks = tasks.filter(t=> t.projectId === p.id);
        const d = ptasks.filter(t=> t.status==='Done').length;
        const total = ptasks.length;
        const pct = total? Math.round((d/total)*100) : 0;
        return `<tr><td>${escapeHtml(p.name||'(unnamed)')}</td><td>${d}</td><td>${total}</td><td>${pct}%</td></tr>`;
      }).join('');
      tbodyProj.innerHTML = rows || '<tr><td colspan="4" class="subtle">No projects</td></tr>';
    }

    // Assignee table
    const tbodyAsg = document.querySelector('#assigneeTable tbody');
    if (tbodyAsg) {
      const map = tasks.reduce((acc,t)=>{ const a=(t.assignedTo||'Unassigned').trim()||'Unassigned'; acc[a]=(acc[a]||0)+1; return acc; },{});
      const rows = Object.entries(map).sort((a,b)=> b[1]-a[1]).map(([name,count])=> `<tr><td>${escapeHtml(name)}</td><td>${count}</td></tr>`).join('');
      tbodyAsg.innerHTML = rows || '<tr><td colspan="2" class="subtle">No tasks</td></tr>';
    }
  });
})();

