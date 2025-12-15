// Global activity logger
//(function(){
//  'use strict';
//  const KEY = 'tm.activity';
//  const load = ()=> { try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; } };
//  const save = (list)=> localStorage.setItem(KEY, JSON.stringify(list));
//  window.logActivity = function(action, detail='', subjectType='', subjectId=''){
//    const userName = (localStorage.getItem('tm.userName')||'User').trim();
//    const userEmail = (localStorage.getItem('tm.email')||'').trim();
//    const list = load();
//    list.push({ id: crypto.randomUUID(), user: userName, userEmail, action, detail, subjectType, subjectId, at: new Date().toISOString() });
//    save(list);
//  };
//})();

// activity.js — Ghi log hoạt động bằng API, lấy user từ /api/me
(function () {
    'use strict';

    const API_CREATE = '/api/create-activitylog';
    const API_ME = '/api/me';
    const QUEUE_KEY = 'tm.activity.queue';

    async function fetchCurrentUser() {
        try {
            const res = await fetch(API_ME, {
                method: 'GET',
                credentials: 'include'
            });

            if (!res.ok) return null;

            const data = await res.json();
            if (data.errorCode !== 0 || !data.user) return null;

            return data.user;
        } catch (err) {
            console.error("❌ Lỗi khi gọi /api/me:", err);
            return null;
        }
    }

    async function sendActivity(payload) {
        try {
            const res = await fetch(API_CREATE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (!res.ok) return false;

            const data = await res.json();
            return data.errorCode === 0;
        } catch (err) {
            console.error('❌ Lỗi gửi activity:', err);
            return false;
        }
    }

    // -----------------------------
    // Queue offline
    // -----------------------------
    function loadQueue() {
        try {
            return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        } catch {
            return [];
        }
    }

    function saveQueue(list) {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(list));
    }

    async function flushQueue() {
        const queue = loadQueue();
        if (!queue.length) return;

        console.log(`Đang gửi lại ${queue.length} activity pending...`);

        const remaining = [];

        for (const item of queue) {
            const ok = await sendActivity(item);
            if (!ok) remaining.push(item);
        }

        saveQueue(remaining);

        if (remaining.length === 0) {
            console.log('Tất cả activity đã gửi thành công');
        }
    }

    window.addEventListener('online', flushQueue);

    // -----------------------------
    // Hàm chính: logActivity()
    // -----------------------------
    window.logActivity = async function (action, detail = '', subjectType = '', subjectId = '') {
        const user = await fetchCurrentUser();

        if (!user) {
            console.warn("Không lấy được user từ /api/me, hủy log activity");
            return;
        }

        const payload = {
            id: crypto.randomUUID(),
            user: user.FullName || user.UserName || "Unknown User",
            userEmail: user.Email || "",
            action,
            detail,
            subjectType,
            subjectId,
            at: new Date().toISOString()
        };
        const ok = await sendActivity(payload);

        if (!ok) {
            console.warn('Không gửi được activity, lưu vào queue offline');
            const queue = loadQueue();
            queue.push(payload);
            saveQueue(queue);
        }
    };
    flushQueue();

})();


