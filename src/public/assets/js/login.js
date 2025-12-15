// assets/js/login.js

document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');

    const showToast = window.showToast;

    if (!loginForm) {
        console.error('Không tìm thấy form đăng nhập (ID: loginForm).');
        return;
    }

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault(); 

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        const loginData = {
            email: email,
            password: password
        };

        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Logging In...';

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData),
                credentials: 'include'
            });


            const result = await response.json();

            if (result.errorCode === 0) {
                localStorage.setItem('tm.email', result.user.email || email);
                localStorage.setItem('tm.role', result.user.role || 'Member');

                showToast(result.errorMessage || 'Đăng nhập thành công!', 'success');

                window.location.href = '/home'; 

            } else {
                const errorMessage = result.errorMessage || 'Email hoặc mật khẩu không chính xác.';
                showToast(errorMessage, 'error');
            }

        } catch (error) {
            console.error('Lỗi khi gọi API đăng nhập:', error);
            showToast('Lỗi mạng: Không thể kết nối đến server. Vui lòng thử lại sau.', 'error');

        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Log In';
        }
    });
});