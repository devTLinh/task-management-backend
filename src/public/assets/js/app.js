// app.js – UI helpers only (NO AUTH LOGIC)
(function () {
    'use strict';

    const ready = (fn) =>
        document.readyState === 'loading'
            ? document.addEventListener('DOMContentLoaded', fn, { once: true })
            : fn();

    ready(() => {

        // Highlight active link
        const links = Array.from(document.querySelectorAll('.header__nav .header__nav-link'));
        const here = location.pathname.split('/').pop() || 'home';
        links.forEach(a => {
            const href = (a.getAttribute('href') || '').split('#')[0];
            if (href && href === here) {
                a.classList.add('header__nav-link--active');
            }
        });

        // Header dropdown
        const menu = document.getElementById('userMenu');
        if (menu) {
            const openMenu = () => {
                menu.classList.add('profile--open');
                menu.setAttribute('aria-expanded', 'true');
            };
            const closeMenu = () => {
                menu.classList.remove('profile--open');
                menu.setAttribute('aria-expanded', 'false');
            };
            const toggleMenu = (e) => {
                if (e) e.preventDefault();
                menu.classList.contains('profile--open') ? closeMenu() : openMenu();
            };

            menu.addEventListener('click', (e) => {
                if (e.target.closest('.profile__avatar, .profile__name, .profile__caret')) {
                    toggleMenu(e);
                }
            });

            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target)) closeMenu();
            });

            // logout call to backend
            const logoutBtn = menu.querySelector('.user-dropdown__logout');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    await fetch('/logout', { method: 'POST', credentials: 'include' });
                    window.location.href = '/login';
                });
            }
        }

    });

})();
