// home.js — TaskManager homepage interactions (using /api/me)
(function () {
    'use strict';

    // -----------------------------
    // Utility functions
    // -----------------------------

    const getInitials = (full) => {
        if (!full || typeof full !== 'string') return 'U';
        const parts = full.trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return 'U';
        const first = parts[0]?.[0] || '';
        const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] || '') : '';
        return (first + last).toUpperCase();
    };

    const escapeHtml = (s = '') =>
        String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    // -----------------------------
    // Fetch user info from /api/me
    // -----------------------------

    async function fetchCurrentUser() {
        try {
            const res = await fetch('/api/me', {
                method: 'GET',
                credentials: 'include'
            });

            if (!res.ok) return null;

            const data = await res.json();
            if (data.errorCode !== 0) return null;
            return data.user;
        } catch (err) {
            console.error('Error calling /api/me:', err);
            return null;
        }
    }


    // -----------------------------
    // DOM Ready
    // -----------------------------

    const ready = (fn) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn, { once: true });
        } else {
            fn();
        }
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

    // -----------------------------
    // MAIN LOGIC
    // -----------------------------

    ready(async () => {

        // 1) Lấy user từ API /api/me
        const currentUser = await fetchCurrentUser();

        if (!currentUser) {
            window.location.href = '/login';
            return;
        }

        // 2) Render header__actions (avatar + name)
        const headerActions = document.querySelector('.header__actions');
        if (headerActions) {
            const initials = getInitials(currentUser.FullName);
            headerActions.innerHTML = `
                <div class="profile" id="userMenu" tabindex="0" aria-haspopup="true" aria-expanded="false">
                    <span class="profile__avatar">${escapeHtml(initials)}</span>
                    <span class="profile__name">${escapeHtml(currentUser.FullName)}</span>
                    <i class="fa-solid fa-caret-down profile__caret" aria-hidden="true"></i>

                    <div class="user-dropdown" role="menu">
                        <a href="/account" class="user-dropdown__item" role="menuitem">
                            <i class="fa-regular fa-user"></i> Hồ sơ
                        </a>
                        <button class="user-dropdown__item user-dropdown__logout" type="button" role="menuitem">
                            <i class="fa-solid fa-right-from-bracket"></i> Đăng xuất
                        </button>
                    </div>
                </div>
            `;

            // Dropdown logic
            const menu = document.getElementById('userMenu');
            const openMenu = () => { menu.classList.add('profile--open'); menu.setAttribute('aria-expanded', 'true'); };
            const closeMenu = () => { menu.classList.remove('profile--open'); menu.setAttribute('aria-expanded', 'false'); };
            const toggleMenu = (e) => { e.preventDefault(); menu.classList.contains('profile--open') ? closeMenu() : openMenu(); };

            menu.addEventListener('click', (e) => {
                if (e.target.closest('.profile__avatar, .profile__name, .profile__caret')) toggleMenu(e);
            });

            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target)) closeMenu();
            });

            // Logout
            const logoutBtn = menu.querySelector('.user-dropdown__logout');
            logoutBtn.addEventListener('click', async () => {
                await fetch('/api/logout', { method: 'POST', credentials: 'include' });
                window.location.href = '/login';
            });
        }

        // -----------------------------
        // UI logic (scroll, animation…)
        // -----------------------------

        const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Header shadow
        const header = document.querySelector('.header');
        const applyHeaderShadow = () => {
            if (!header) return;
            header.style.boxShadow = window.scrollY > 2 ? '0 2px 12px rgba(0,0,0,0.06)' : 'none';
        };
        applyHeaderShadow();
        window.addEventListener('scroll', throttle(applyHeaderShadow, 80));

        // Active nav link
        const navLinks = Array.from(document.querySelectorAll('.header__nav .header__nav-link'));
        navLinks.forEach((link) => {
            link.addEventListener('click', () => {
                navLinks.forEach((l) => l.classList.remove('header__nav-link--active'));
                link.classList.add('header__nav-link--active');
            });
        });

        // Smooth scroll
        const onPageAnchors = Array.from(document.querySelectorAll('a[href^="#"]'));
        onPageAnchors.forEach((a) => {
            a.addEventListener('click', (e) => {
                const href = a.getAttribute('href');
                if (!href || href === '#' || href.length < 2) return;
                const target = document.querySelector(href);
                if (!target) return;
                e.preventDefault();
                const top = target.getBoundingClientRect().top + window.pageYOffset - 80;
                window.scrollTo({ top, behavior: prefersReduce ? 'auto' : 'smooth' });
            });
        });

        // Reveal animations
        const revealEls = Array.from(document.querySelectorAll('[data-anim]'));
        if (revealEls.length && !prefersReduce) {
            revealEls.forEach((el, idx) => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(16px)';
                el.style.transition = 'opacity 500ms ease, transform 500ms ease';
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

        // Feature cards
        const links = ['/users', '/projects', '/tasks', '/users', '/tasks', '/reports'];
        const cards = Array.from(document.querySelectorAll('.features__card'));
        cards.forEach((card, idx) => {
            card.setAttribute('tabindex', '0');
            card.addEventListener('click', () => window.location.href = links[idx] || '/home');
            card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); } });
        });

        // KPIs → reports
        document.querySelectorAll('.kpi').forEach(k => {
            k.style.cursor = 'pointer';
            k.setAttribute('tabindex', '0');
            const go = () => window.location.href = '/reports';
            k.addEventListener('click', go);
            k.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
        });

        // Get Started button
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
