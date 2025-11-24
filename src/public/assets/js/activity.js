// Global activity logger
(function(){
  'use strict';
  const KEY = 'tm.activity';
  const load = ()=> { try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; } };
  const save = (list)=> localStorage.setItem(KEY, JSON.stringify(list));
  window.logActivity = function(action, detail='', subjectType='', subjectId=''){
    const userName = (localStorage.getItem('tm.userName')||'User').trim();
    const userEmail = (localStorage.getItem('tm.email')||'').trim();
    const list = load();
    list.push({ id: crypto.randomUUID(), user: userName, userEmail, action, detail, subjectType, subjectId, at: new Date().toISOString() });
    save(list);
  };
})();

