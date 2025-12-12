
(function () {
    const form = document.getElementById('loginForm');
    const errorBox = document.getElementById('ajax-error-message-box');

    const displayError = (message) => {
        if (errorBox) {
            errorBox.textContent = message;
            errorBox.style.display = 'block';
        }
    };

    const clearError = () => {
        if (errorBox) {
            errorBox.textContent = '';
            errorBox.style.display = 'none';
        }
    }

    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            clearError();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });

                if (response.status !== 200) {
                    displayError('Lỗi máy chủ: Không thể hoàn tất yêu cầu.');
                    return;
                }

                const data = await response.json();

                if (data.errorCode === 0) {
                    
                    alert('Đăng nhập thành công! Đang chuyển hướng...');
                    window.location.href = '/home';
                    alert('1')
                } else {
                    
                    displayError(data.errorMessage || 'Đã xảy ra lỗi không xác định.');
                }
            } catch (error) {
                console.error('Fetch error:', error);
                displayError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
            }
        });
    }
})();