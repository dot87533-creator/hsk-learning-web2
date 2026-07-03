/* vocab-state.js — Quan ly trang thai hoc tap cho tung tu vung, luu trong localStorage
   theo tung tai khoan (key gan voi email user dang nhap). Cung cap API:
   window.HSK_VocabState.toggleBookmark(id), .toggleFavorite(id), .markLearned(id),
   .markNeedReview(id), .setNote(id, text), .getState(id), .getHistory(), .logActivity(...) */
(function () {
  "use strict";

  function userKey() {
    const user = window.HSK && window.HSK.getCurrentUser && window.HSK.getCurrentUser();
    return user ? user.email : "guest";
  }
  function stateKey() { return "hsk_vocab_state_" + userKey(); }
  function historyKey() { return "hsk_vocab_history_" + userKey(); }

  const Store = () => window.HSK.Store;

  function loadAll() {
    return Store().get(stateKey(), {});
  }
  function saveAll(all) {
    Store().set(stateKey(), all);
  }
  function getEntry(all, id) {
    return all[id] || { learned: false, needReview: false, bookmarked: false, favorite: false, note: "", lastSeen: null, timesReviewed: 0 };
  }

  const HSK_VocabState = {
    getState(id) {
      const all = loadAll();
      return getEntry(all, id);
    },

    toggleBookmark(id) {
      const all = loadAll();
      const e = getEntry(all, id);
      e.bookmarked = !e.bookmarked;
      all[id] = e; saveAll(all);
      return e.bookmarked;
    },

    toggleFavorite(id) {
      const all = loadAll();
      const e = getEntry(all, id);
      e.favorite = !e.favorite;
      all[id] = e; saveAll(all);
      return e.favorite;
    },

    markLearned(id, val) {
      const all = loadAll();
      const e = getEntry(all, id);
      e.learned = val === undefined ? true : val;
      if (e.learned) e.needReview = false;
      e.lastSeen = new Date().toISOString();
      e.timesReviewed = (e.timesReviewed || 0) + 1;
      all[id] = e; saveAll(all);
      return e;
    },

    markNeedReview(id, val) {
      const all = loadAll();
      const e = getEntry(all, id);
      e.needReview = val === undefined ? true : val;
      all[id] = e; saveAll(all);
      return e;
    },

    setNote(id, text) {
      const all = loadAll();
      const e = getEntry(all, id);
      e.note = text;
      all[id] = e; saveAll(all);
      return e;
    },

    /* Danh sach id theo dieu kien: 'bookmarked' | 'favorite' | 'learned' | 'needReview' */
    listIdsBy(flag) {
      const all = loadAll();
      return Object.keys(all).filter(id => all[id][flag]);
    },

    /* Tra ve danh sach tu vung day du (object) thoa dieu kien */
    getWordsBy(flag) {
      const ids = this.listIdsBy(flag);
      return ids.map(id => window.HSK_getWordById(id)).filter(Boolean);
    },

    /* ---- Lich su hoc tap (cac phien on tap / thi thu / lam bai) ---- */
    logActivity(entry) {
      // entry: { type, levelOrSkill, detail, score, durationSec, date }
      const list = Store().get(historyKey(), []);
      list.unshift(Object.assign({ date: new Date().toISOString() }, entry));
      if (list.length > 500) list.length = 500;
      Store().set(historyKey(), list);
      return list;
    },

    getHistory(limit) {
      const list = Store().get(historyKey(), []);
      return limit ? list.slice(0, limit) : list;
    },

    clearHistory() {
      Store().set(historyKey(), []);
    },

    /* Thong ke nhanh dung cho dashboard / profile */
    getSummary() {
      const all = loadAll();
      const ids = Object.keys(all);
      return {
        totalTracked: ids.length,
        learned: ids.filter(id => all[id].learned).length,
        needReview: ids.filter(id => all[id].needReview).length,
        bookmarked: ids.filter(id => all[id].bookmarked).length,
        favorite: ids.filter(id => all[id].favorite).length
      };
    }
  };

  window.HSK_VocabState = HSK_VocabState;
})();
