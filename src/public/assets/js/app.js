//// Basic app helpers for feature pages (English UI)
//// - Auth guard
//// - Active nav highlight
//// - Header user menu with Profile / Log out
//(function(){
//  'use strict';
//  const ready = (fn)=> document.readyState==='loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();
//  // Simple RBAC helpers
//  const roleRank = { 'Member': 1, 'Leader': 2, 'Admin': 3 };
//  const getRole = () => (localStorage.getItem('tm.role') || 'Member');
//  const getUserName = () => (localStorage.getItem('tm.userName') || 'User').trim();
//  const hasRole = (minRole) => (roleRank[getRole()] || 1) >= (roleRank[minRole] || 1);
//  // Expose globally for feature pages
//  window.tm = Object.freeze({ role: getRole, hasRole, user: getUserName, rank: (r)=> roleRank[r]||0 });
//  ready(()=>{
//    // Auth guard
//    if (localStorage.getItem('tm.auth') !== '1') {
//      window.location.href = 'login.html';
//      return;
//    }

//    // Active link
//    const links = Array.from(document.querySelectorAll('.header__nav .header__nav-link'));
//    const here = location.pathname.split('/').pop() || 'home';
//    links.forEach(a=>{ const href = (a.getAttribute('href')||'').split('#')[0]; if (href && href === here) a.classList.add('header__nav-link--active'); });

//    // Replace header actions with user menu
//    const headerActions = document.querySelector('.header__actions');
//    if (headerActions) {
//      const storedName = localStorage.getItem('tm.userName') || 'User';
//      const name = storedName.trim();
//      const parts = name.split(/\s+/).filter(Boolean);
//      const initials = ((parts[0]?.[0]||'') + (parts.length>1 ? (parts[parts.length-1]?.[0]||'') : '')).toUpperCase() || 'U';
//      headerActions.innerHTML = `
//        <div class="profile" id="userMenu" tabindex="0" aria-haspopup="true" aria-expanded="false">
//          <span class="profile__avatar">${initials}</span>
//          <span class="profile__name">${name}</span>
//          <i class="fa-solid fa-caret-down profile__caret" aria-hidden="true"></i>
//          <div class="user-dropdown" role="menu">
//            <a href="account.html" class="user-dropdown__item" role="menuitem"><i class="fa-regular fa-user"></i> Profile</a>
//            <button class="user-dropdown__item user-dropdown__logout" type="button" role="menuitem"><i class="fa-solid fa-right-from-bracket"></i> Log out</button>
//          </div>
//        </div>`;

//      const menu = document.getElementById('userMenu');
//      const openMenu = () => { menu.classList.add('profile--open'); menu.setAttribute('aria-expanded','true'); };
//      const closeMenu = () => { menu.classList.remove('profile--open'); menu.setAttribute('aria-expanded','false'); };
//      const toggleMenu = (e) => { if (e && e.preventDefault) e.preventDefault(); menu.classList.contains('profile--open') ? closeMenu() : openMenu(); };
//      menu.addEventListener('click', (e) => { if (e.target.closest('.profile__avatar, .profile__name, .profile__caret')) toggleMenu(e); });
//      menu.addEventListener('keydown', (e) => { if (e.key==='Enter'||e.key===' ') toggleMenu(e); else if (e.key==='Escape') closeMenu(); });
//      document.addEventListener('click', (e) => { if (!menu.contains(e.target)) closeMenu(); });
//      const logoutBtn = menu.querySelector('.user-dropdown__logout');
//      logoutBtn.addEventListener('click', () => { localStorage.removeItem('tm.auth'); localStorage.removeItem('tm.userName'); localStorage.removeItem('tm.email'); window.location.href='home.html'; });
//    }
//  });
//})();
// Basic app helpers for feature pages (English UI)
// - Auth guard using /api/me
// - Active nav highlight
// - Header user menu with Profile / Log out
(function () {
    'use strict';

    const ready = (fn) =>
        document.readyState === 'loading'
            ? document.addEventListener('DOMContentLoaded', fn, { once: true })
            : fn();

    // RBAC helpers
    const roleRank = { Member: 1, Leader: 2, Admin: 3 };

    // API: get current user
    async function fetchCurrentUser() {
        try {
            const res = await fetch('/api/me', {
                method: 'GET',
                credentials: 'include'
            });

            if (!res.ok) return null;

            const data = await res.json();
            if (data.errorCode !== 0 || !data.user) return null;

            return data.user;
        } catch (err) {
            console.error('Error calling /api/me:', err);
            return null;
        }
    }

    ready(async () => {
        // ✅ Auth guard bằng API
        const currentUser = await fetchCurrentUser();
        if (!currentUser) {
            window.location.href = '/login';
            return;
        }

        // ✅ Expose RBAC globally
        window.tm = Object.freeze({
            role: () => currentUser.Role,
            hasRole: (minRole) =>
                (roleRank[currentUser.Role] || 1) >= (roleRank[minRole] || 1),
            user: () => currentUser.FullName,
            rank: (r) => roleRank[r] || 0
        });

        // ✅ Active nav highlight
        const links = Array.from(
            document.querySelectorAll('.header__nav .header__nav-link')
        );
        const here = location.pathname.split('/').pop() || 'home';
        links.forEach((a) => {
            const href = (a.getAttribute('href') || '').split('#')[0];
            if (href && href === here) {
                a.classList.add('header__nav-link--active');
            }
        });

        // ✅ Header user menu
        const headerActions = document.querySelector('.header__actions');
        if (headerActions) {
            const name = currentUser.FullName || 'User';
            const parts = name.split(/\s+/).filter(Boolean);
            const initials =
                ((parts[0]?.[0] || '') +
                    (parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '')
                ).toUpperCase() || 'U';

            headerActions.innerHTML = `
        <div class="profile" id="userMenu" tabindex="0" aria-haspopup="true" aria-expanded="false">
          <span class="profile__avatar">${initials}</span>
          <span class="profile__name">${name}</span>
          <i class="fa-solid fa-caret-down profile__caret" aria-hidden="true"></i>
          <div class="user-dropdown" role="menu">
            <a href="account.html" class="user-dropdown__item" role="menuitem">
              <i class="fa-regular fa-user"></i> Profile
            </a>
            <button class="user-dropdown__item user-dropdown__logout" type="button" role="menuitem">
              <i class="fa-solid fa-right-from-bracket"></i> Log out
            </button>
          </div>
        </div>`;

            const menu = document.getElementById('userMenu');
            const openMenu = () => {
                menu.classList.add('profile--open');
                menu.setAttribute('aria-expanded', 'true');
            };
            const closeMenu = () => {
                menu.classList.remove('profile--open');
                menu.setAttribute('aria-expanded', 'false');
            };
            const toggleMenu = (e) => {
                if (e && e.preventDefault) e.preventDefault();
                menu.classList.contains('profile--open') ? closeMenu() : openMenu();
            };

            menu.addEventListener('click', (e) => {
                if (
                    e.target.closest('.profile__avatar, .profile__name, .profile__caret')
                )
                    toggleMenu(e);
            });

            menu.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') toggleMenu(e);
                else if (e.key === 'Escape') closeMenu();
            });

            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target)) closeMenu();
            });

            const logoutBtn = menu.querySelector('.user-dropdown__logout');
            logoutBtn.addEventListener('click', async () => {
                try {
                    await fetch('/api/logout', {
                        method: 'POST',
                        credentials: 'include'
                    });
                } catch { }

                window.location.href = '/login';
            });
        }
    });
})();

