// register.js
(function () {
    'use strict';

    const form = document.querySelector('.auth__form');

    const show = (msg, type = 'info') => {
        if (window.showToast) showToast(msg, type);
        else alert(msg);
    };

    async function apiRegister(payload) {
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            return await res.json();
        } catch (err) {
            return { errorCode: 500, errorMessage: 'Server error' };
        }
    }

    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const fullName = form.querySelector('input[type="text"]').value.trim();
            const email = form.querySelector('input[type="email"]').value.trim();
            const password = form.querySelector('input[type="password"]').value;

            if (!fullName) return show('Full name is required', 'warning');
            if (!email) return show('Email is required', 'warning');
            if (!password || password.length < 6)
                return show('Password must be at least 6 characters', 'warning');

            const payload = {
                fullName: fullName,
                email: email,
                password: password
            };

            const result = await apiRegister(payload);

            if (result.errorCode === 0) {
                show('Account created successfully!', 'success');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 800);
            } else {
                show(result.errorMessage || 'Registration failed', 'error');
            }
        });
    }
})();
