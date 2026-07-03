/* reading-state.js — Luu tien do luyen doc (da doc, diem trac nghiem) theo tung tai khoan */
(function () {
  "use strict";
  function userKey() {
    const user = window.HSK && window.HSK.getCurrentUser && window.HSK.getCurrentUser();
    return user ? user.email : "guest";
  }
  function key() { return "hsk_reading_state_" + userKey(); }
  const Store = () => window.HSK.Store;
  function loadAll() { return Store().get(key(), {}); }
  function saveAll(all) { Store().set(key(), all); }

  window.HSK_ReadingState = {
    isDone(id) { const all = loadAll(); return !!(all[id] && all[id].done); },
    getScore(id) { const all = loadAll(); return all[id] ? all[id].score : null; },
    recordResult(id, scorePct) {
      const all = loadAll();
      const prevBest = all[id] ? all[id].score : 0;
      all[id] = { done: true, score: Math.max(prevBest || 0, scorePct), lastDate: new Date().toISOString() };
      saveAll(all);
      return all[id];
    },
    getSummary() {
      const all = loadAll();
      const ids = Object.keys(all).filter(id => all[id].done);
      const avg = ids.length ? Math.round(ids.reduce((s, id) => s + all[id].score, 0) / ids.length) : null;
      return { passagesDone: ids.length, avgScore: avg };
    }
  };
})();
