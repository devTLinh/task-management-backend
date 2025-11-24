// Enhanced global toast notifications with titles, accent bar and progress
(function(){
  'use strict';
  const ICONS = { success:'fa-circle-check', error:'fa-triangle-exclamation', warning:'fa-circle-exclamation', info:'fa-circle-info' };
  const TITLES = { success:'Success', error:'Error', warning:'Warning', info:'Information' };
  function ensureContainer(){
    let c = document.querySelector('.toast-container');
    if (!c){
      c = document.createElement('div');
      c.className = 'toast-container';
      c.setAttribute('aria-live','polite');
      c.setAttribute('aria-atomic','true');
      document.body.appendChild(c);
    }
    return c;
  }
  // Simple dedupe to avoid accidental multi-fire (same message/type within a short window)
  const RECENT = new Map(); // key -> last timestamp
  window.showToast = function(message, type='info', opts={}){
    const c = ensureContainer();
    const timeout = Number.isFinite(opts.timeout) ? opts.timeout : (type==='error' ? 5000 : 3000);
    const icon = ICONS[type] || ICONS.info;
    const title = opts.title || TITLES[type] || 'Notice';
    const key = `${type}|${title}|${message}`;
    const dedupeWindow = Number.isFinite(opts.dedupeWindow) ? opts.dedupeWindow : 200; // ms
    const now = Date.now();
    const last = RECENT.get(key) || 0;
    if (now - last < dedupeWindow) return; // skip duplicate bursts
    RECENT.set(key, now);
    setTimeout(()=> { if (RECENT.get(key) === now) RECENT.delete(key); }, dedupeWindow);

    // Only allow a single toast visible at a time by default
    const allowMultiple = opts.allowMultiple === true;
    if (!allowMultiple) {
      // Remove any existing toasts immediately (replace behavior)
      c.querySelectorAll('.toast').forEach(n => n.remove());
    }
    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.style.setProperty('--dur', timeout + 'ms');
    t.innerHTML = `
      <div class="toast__iconwrap"><i class="fa-solid ${icon}" aria-hidden="true"></i></div>
      <div class="toast__body">
        <div class="toast__title">${title}</div>
        <div class="toast__msg">${message}</div>
      </div>
      <button class="toast__close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
      <div class="toast__progress"></div>`;
    c.appendChild(t);

    let removed = false;
    const doRemove = ()=> { if (removed) return; removed = true; t.remove(); };
    const close = ()=> {
      if (removed) return;
      t.classList.add('toast--hide');
      const cleanup = ()=> { t.removeEventListener('transitionend', cleanup); doRemove(); };
      t.addEventListener('transitionend', cleanup);
      // Fallback in case transitionend doesn't fire
      setTimeout(doRemove, 220);
    };

    // Timer with pause-on-hover support
    let start = performance.now();
    let remaining = timeout;
    let timerId = setTimeout(close, remaining);
    const onEnter = ()=>{ clearTimeout(timerId); remaining -= (performance.now() - start); };
    const onLeave = ()=>{ start = performance.now(); timerId = setTimeout(close, Math.max(0, remaining)); };
    t.addEventListener('mouseenter', onEnter);
    t.addEventListener('mouseleave', onLeave);

    t.querySelector('.toast__close').addEventListener('click', close);
  };
})();
