// home.js â€” interactions for TaskManager homepage
// - Active link highlight
// - Smooth scrolling for on-page anchors
// - Header shadow on scroll
// - Reveal animations for feature cards (prefers-reduced-motion aware)

(function () {
  'use strict';

  const ready = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }

    // 6b) Upgrade simple profile link (if present) to dropdown with logout
    (function(){
      //if (!isAuthed()) return;
      const container = document.querySelector('.header__actions');
      if (!container) return;
      const simple = container.querySelector('.profile');
      if (simple && simple.tagName === 'A') {
        const nameEl = simple.querySelector('.profile__name');
        const avatarEl = simple.querySelector('.profile__avatar');
        const name = nameEl ? nameEl.textContent.trim() : (localStorage.getItem('tm.userName') || 'User');
        const initials = avatarEl ? avatarEl.textContent.trim() : (name.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase() || 'U');
        simple.outerHTML = `
          <div class="profile" id="userMenu" tabindex="0" aria-haspopup="true" aria-expanded="false">
            <span class="profile__avatar">${name ? name.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase() : initials}</span>
            <span class="profile__name">${name}</span>
            <i class="fa-solid fa-caret-down profile__caret" aria-hidden="true"></i>
            <div class="user-dropdown" role="menu">
              <a href="account.html" class="user-dropdown__item" role="menuitem"><i class="fa-regular fa-user"></i> Há»“ sÆ¡</a>
              <button class="user-dropdown__item user-dropdown__logout" type="button" role="menuitem"><i class="fa-solid fa-right-from-bracket"></i> ÄÄƒng xuáº¥t</button>
            </div>
          </div>`;
        const menu = document.getElementById('userMenu');
        const openMenu = () => { menu.classList.add('profile--open'); menu.setAttribute('aria-expanded','true'); };
        const closeMenu = () => { menu.classList.remove('profile--open'); menu.setAttribute('aria-expanded','false'); };
        const toggleMenu = (e) => { if (e && e.preventDefault) e.preventDefault(); menu.classList.contains('profile--open') ? closeMenu() : openMenu(); };
        menu.addEventListener('click', (e) => { if (e.target.closest('.profile__avatar, .profile__name, .profile__caret')) toggleMenu(e); });
        menu.addEventListener('keydown', (e) => { if (e.key==='Enter'||e.key===' ') toggleMenu(e); else if (e.key==='Escape') closeMenu(); });
        document.addEventListener('click', (e) => { if (!menu.contains(e.target)) closeMenu(); });
        const logoutBtn = menu.querySelector('.user-dropdown__logout');
        logoutBtn.addEventListener('click', () => { localStorage.removeItem('tm.auth'); localStorage.removeItem('tm.userName'); localStorage.removeItem('tm.email'); window.location.href='home.html'; });
      }
    })();
  };

  const throttle = (fn, wait = 100) => {
    let last = 0, t;
    return function throttled(...args) {
      const now = Date.now();
      if (now - last >= wait) {
        last = now;
        fn.apply(this, args);
      } else {
        clearTimeout(t);
        t = setTimeout(() => {
          last = Date.now();
          fn.apply(this, args);
        }, wait - (now - last));
      }
    };
  };

  ready(() => {
    const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1) Header shadow on scroll (visible effect without needing CSS changes)
    const header = document.querySelector('.header');
    const applyHeaderShadow = () => {
      if (!header) return;
      if (window.scrollY > 2) {
        header.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
      } else {
        header.style.boxShadow = 'none';
      }
    };
    applyHeaderShadow();
    window.addEventListener('scroll', throttle(applyHeaderShadow, 80));

    // 2) Active nav link highlight
    const navLinks = Array.from(document.querySelectorAll('.header__nav .header__nav-link'));
    if (navLinks.length) {
      navLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
          // Only toggle if same-page link or hash; otherwise keep default
          navLinks.forEach((l) => l.classList.remove('header__nav-link--active'));
          link.classList.add('header__nav-link--active');
        });
      });
    }

    // 3) Smooth scroll for on-page anchors
    const onPageAnchors = Array.from(document.querySelectorAll('a[href^="#"]'));
    onPageAnchors.forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href === '#' || href.length < 2) return; // let default for '#'
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.pageYOffset - 80; // offset ~ header height
        window.scrollTo({ top, behavior: prefersReduce ? 'auto' : 'smooth' });
      });
    });

    // 4) Reveal animations for elements with [data-anim]
    const revealEls = Array.from(document.querySelectorAll('[data-anim]'));
    if (revealEls.length && !prefersReduce) {
      // Set initial state inline so no CSS change required
      revealEls.forEach((el, idx) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(16px)';
        el.style.transition = 'opacity 500ms ease, transform 500ms ease';
        // small stagger
        el.style.transitionDelay = (idx % 6) * 40 + 'ms';
      });

      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            io.unobserve(el);
          }
        });
      }, { threshold: 0.18 });

      revealEls.forEach((el) => io.observe(el));
    }

    // 5) Require auth for protected actions
    const isAuthed = () => localStorage.getItem('tm.auth') === '1';
    const getInitials = (full) => {
      const parts = (full || '').trim().split(/\s+/).filter(Boolean);
      if (!parts.length) return 'U';
      const first = parts[0]?.[0] || '';
      const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] || '') : '';
      const res = (first + last).toUpperCase();
      return res || 'U';
    };
    const authTargets = Array.from(document.querySelectorAll('[data-auth="required"]'));
    authTargets.forEach((el) => {
      el.addEventListener('click', (e) => {
        if (!isAuthed()) {
          e.preventDefault();
          window.location.href = 'login.html';
        }
      });
    });

    // 6) Swap header actions to user profile when logged in
    const escapeHtml = (s = '') => s.replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const headerActions = document.querySelector('.header__actions');
    if (headerActions && isAuthed()) {
      const storedName = localStorage.getItem('tm.userName') || 'User';
      const name = storedName.trim();
      const initials = getInitials(name);
      headerActions.innerHTML = `
        <a href="account.html" class="profile" aria-label="TÃ i khoáº£n">
          <span class="profile__avatar">${escapeHtml(initials)}</span>
          <span class="profile__name">${escapeHtml(name)}</span>
        </a>
      `;
    }

    // 7) Make feature cards clickable to pages
    (function(){
      const isAuthed = () => localStorage.getItem('tm.auth') === '1';
      const links = [
        'users.html',      // Team Management
        'projects.html',   // Project Planning
        'tasks.html',      // Task Tracking
        'users.html',      // Communication
        'tasks.html',      // File Management
        'reports.html'     // Reports & Analytics
      ];
      const cards = Array.from(document.querySelectorAll('.features__card'));
      cards.forEach((card, idx) => {
        card.setAttribute('tabindex','0');
        card.addEventListener('click', () => {
          const href = links[idx] || 'home.html';
          //if (!isAuthed() && card.hasAttribute('data-auth')) { window.location.href='login.html'; return; }
          window.location.href = 'home.html';
        });
        card.addEventListener('keydown', (e)=>{ if (e.key==='Enter' || e.key===' ') { e.preventDefault(); card.click(); } });
        card.dataset.auth = 'required';
      });
      // KPIs jump to reports
      document.querySelectorAll('.kpi').forEach(k => {
        k.style.cursor = 'pointer';
        k.setAttribute('tabindex','0');
        const go = ()=> { if (isAuthed()) window.location.href='reports.html'; else window.location.href='login.html'; };
        k.addEventListener('click', go);
        k.addEventListener('keydown', (e)=>{ if (e.key==='Enter' || e.key===' ') { e.preventDefault(); go(); } });
      });
    })();

    // 8) Optional: demo button handlers
    const getStartedBtn = document.querySelector('.hero__buttons .btn.btn--primary');
    if (getStartedBtn) {
      getStartedBtn.addEventListener('click', (e) => {
        const features = document.querySelector('.features');
        if (features) {
          e.preventDefault();
          const top = features.getBoundingClientRect().top + window.pageYOffset - 70;
          window.scrollTo({ top, behavior: prefersReduce ? 'auto' : 'smooth' });
        }
      });
    }
  });
})();


