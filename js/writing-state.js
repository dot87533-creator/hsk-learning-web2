/* writing-state.js — Luu tien do luyen viet chu Han theo tung tai khoan (localStorage) */
(function () {
  "use strict";

  function userKey() {
    const user = window.HSK && window.HSK.getCurrentUser && window.HSK.getCurrentUser();
    return user ? user.email : "guest";
  }
  function key() { return "hsk_writing_state_" + userKey(); }
  const Store = () => window.HSK.Store;

  function loadAll() { return Store().get(key(), {}); }
  function saveAll(all) { Store().set(key(), all); }

  const HSK_WritingState = {
    getChar(ch) {
      const all = loadAll();
      return all[ch] || { attempts: 0, correctStrokes: 0, totalStrokes: 0, mastered: false, lastPracticed: null };
    },
    recordQuizResult(ch, totalStrokesInChar, mistakesTotal) {
      const all = loadAll();
      const e = all[ch] || { attempts: 0, correctStrokes: 0, totalStrokes: 0, mastered: false, lastPracticed: null };
      e.attempts += 1;
      e.totalStrokes += totalStrokesInChar;
      e.correctStrokes += Math.max(0, totalStrokesInChar - mistakesTotal);
      e.lastPracticed = new Date().toISOString();
      if (mistakesTotal === 0) e.mastered = true;
      all[ch] = e;
      saveAll(all);
      return e;
    },
    getSummary() {
      const all = loadAll();
      const chars = Object.keys(all);
      let totalCorrect = 0, totalStrokes = 0;
      chars.forEach(c => { totalCorrect += all[c].correctStrokes; totalStrokes += all[c].totalStrokes; });
      return {
        practicedCount: chars.filter(c => all[c].attempts > 0).length,
        masteredCount: chars.filter(c => all[c].mastered).length,
        accuracy: totalStrokes ? Math.round((totalCorrect / totalStrokes) * 100) : null
      };
    },
    isMastered(ch) {
      const all = loadAll();
      return !!(all[ch] && all[ch].mastered);
    }
  };

  window.HSK_WritingState = HSK_WritingState;
})();
