/* reading.js — Trang Luyện đọc: danh sách bài theo cấp độ, xem bài có pinyin/dịch/tooltip từng từ,
   phát âm (TTS), và trắc nghiệm kiểm tra hiểu bài. */
(function () {
  "use strict";
  const $ = sel => document.querySelector(sel);
  let currentPassage = null;
  let showPinyin = false;
  let userAnswers = {};

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  const LEVELS = [
    { id: "all", name: "Tất cả" },
    { id: "hsk1", name: "HSK 1" }, { id: "hsk2", name: "HSK 2" }, { id: "hsk3", name: "HSK 3" },
    { id: "hsk4", name: "HSK 4" }, { id: "hsk5", name: "HSK 5" }, { id: "hsk6", name: "HSK 6" }
  ];
  let activeLevel = "all";

  function renderLevelTabs() {
    $("#readLevelTabs").innerHTML = LEVELS.map(l =>
      `<button class="read-level-tab ${l.id === activeLevel ? "active" : ""}" data-level="${l.id}">${l.name}</button>`
    ).join("");
    document.querySelectorAll(".read-level-tab").forEach(btn => {
      btn.addEventListener("click", () => { activeLevel = btn.dataset.level; renderLevelTabs(); renderPassageGrid(); });
    });
  }

  function renderPassageGrid() {
    const list = window.HSK_READING_getByLevel(activeLevel);
    const grid = $("#readPassageGrid");
    if (!list.length) {
      grid.innerHTML = `<p class="muted">Chưa có bài đọc ở cấp độ này. Bài đọc HSK 7-9 sẽ được bổ sung sớm.</p>`;
      return;
    }
    grid.innerHTML = list.map(p => {
      const done = window.HSK_ReadingState.isDone(p.id);
      const score = window.HSK_ReadingState.getScore(p.id);
      return `
      <div class="read-passage-card ${done ? "done" : ""}" data-id="${p.id}">
        <div class="rp-level">${p.level.toUpperCase()}${done ? " · ✓ Đã hoàn thành (" + score + "%)" : ""}</div>
        <div class="rp-title">${escapeHtml(p.title)}</div>
        <div class="rp-title-vi">${escapeHtml(p.title_vi)}</div>
        <div class="rp-meta"><span>⏱ ~${p.minutes} phút</span><span>❓ ${p.questions.length} câu hỏi</span></div>
      </div>`;
    }).join("");
    grid.querySelectorAll(".read-passage-card").forEach(card => {
      card.addEventListener("click", () => openPassage(card.dataset.id));
    });
  }

  function updateSummary() {
    const s = window.HSK_ReadingState.getSummary();
    $("#readDoneCount").textContent = s.passagesDone;
    $("#readAvgScore").textContent = s.avgScore === null ? "—" : s.avgScore + "%";
  }

  function renderPassageText() {
    const wrap = $("#readPassageText");
    wrap.innerHTML = currentPassage.sentences.map(sentence =>
      sentence.map(tok => {
        if (!tok.p) return escapeHtml(tok.h);
        const pinyinHtml = showPinyin ? `<span class="read-pinyin-line">${escapeHtml(tok.p)}</span>` : "";
        return `<span class="rw" data-h="${escapeHtml(tok.h)}" data-p="${escapeHtml(tok.p)}" data-m="${escapeHtml(tok.m)}">${pinyinHtml}${escapeHtml(tok.h)}</span>`;
      }).join("")
    ).join(" ");

    wrap.querySelectorAll(".rw").forEach(el => {
      el.addEventListener("click", (e) => {
        window.HSK_TTS && window.HSK_TTS.speak(el.dataset.h);
        showWordTip(el, e);
      });
      el.addEventListener("mouseenter", (e) => showWordTip(el, e));
      el.addEventListener("mouseleave", hideWordTip);
    });
  }

  let tipTimeout;
  function showWordTip(el) {
    const tip = $("#readWordTip");
    $("#rwtHanzi").textContent = el.dataset.h;
    $("#rwtPinyin").textContent = el.dataset.p;
    $("#rwtMeaning").textContent = el.dataset.m;
    const rect = el.getBoundingClientRect();
    tip.style.left = Math.min(window.innerWidth - 260, rect.left) + "px";
    tip.style.top = (rect.top - 64) + "px";
    tip.classList.add("show");
    clearTimeout(tipTimeout);
    tipTimeout = setTimeout(() => tip.classList.remove("show"), 2200);
  }
  function hideWordTip() { $("#readWordTip").classList.remove("show"); }

  function renderQuiz() {
    userAnswers = {};
    $("#quizProgress").textContent = "0 / " + currentPassage.questions.length + " đã trả lời";
    $("#quizResult").classList.add("hidden");
    $("#submitQuizBtn").classList.remove("hidden");
    $("#quizQuestions").innerHTML = currentPassage.questions.map((q, qi) => `
      <div class="read-quiz-q" data-qi="${qi}">
        <div class="rq-title">${qi + 1}. ${escapeHtml(q.q)}</div>
        ${q.options.map((opt, oi) => `<button type="button" class="read-quiz-opt" data-oi="${oi}">${escapeHtml(opt)}</button>`).join("")}
      </div>
    `).join("");

    document.querySelectorAll(".read-quiz-q").forEach(qEl => {
      const qi = +qEl.dataset.qi;
      qEl.querySelectorAll(".read-quiz-opt").forEach(optEl => {
        optEl.addEventListener("click", () => {
          qEl.querySelectorAll(".read-quiz-opt").forEach(o => o.classList.remove("selected"));
          optEl.classList.add("selected");
          userAnswers[qi] = +optEl.dataset.oi;
          $("#quizProgress").textContent = Object.keys(userAnswers).length + " / " + currentPassage.questions.length + " đã trả lời";
        });
      });
    });
  }

  function submitQuiz() {
    const total = currentPassage.questions.length;
    if (Object.keys(userAnswers).length < total) {
      window.HSK.Toast.warning("Chưa hoàn thành", "Hãy trả lời tất cả câu hỏi trước khi nộp bài.");
      return;
    }
    let correct = 0;
    currentPassage.questions.forEach((q, qi) => {
      const qEl = document.querySelector(`.read-quiz-q[data-qi="${qi}"]`);
      qEl.querySelectorAll(".read-quiz-opt").forEach((optEl, oi) => {
        optEl.classList.remove("selected");
        if (oi === q.correct) optEl.classList.add("correct");
        else if (oi === userAnswers[qi] && oi !== q.correct) optEl.classList.add("incorrect");
        optEl.disabled = true;
        optEl.style.cursor = "default";
      });
      if (userAnswers[qi] === q.correct) correct++;
    });
    const pct = Math.round((correct / total) * 100);
    window.HSK_ReadingState.recordResult(currentPassage.id, pct);
    $("#submitQuizBtn").classList.add("hidden");
    const resBox = $("#quizResult");
    resBox.classList.remove("hidden");
    resBox.innerHTML = `
      <div class="rqr-score">${pct}%</div>
      <p style="font-weight:700;margin:6px 0 0">Bạn đúng ${correct}/${total} câu</p>
      <p class="muted">${pct >= 80 ? "Xuất sắc! Bạn đã hiểu rất rõ bài đọc này." : pct >= 50 ? "Khá tốt — hãy đọc lại một lần nữa để chắc chắn hơn." : "Hãy đọc lại bài và thử lại nhé, đừng nản!"}</p>
      <button class="btn btn-soft" id="retryQuizBtn" style="margin-top:10px">↺ Làm lại</button>
    `;
    $("#retryQuizBtn").addEventListener("click", renderQuiz);
    updateSummary();
    if (window.HSK_VocabState) {
      window.HSK_VocabState.logActivity({ type: "reading", levelOrSkill: currentPassage.level, detail: "Luyện đọc: " + currentPassage.title, score: pct, durationSec: currentPassage.minutes * 60 });
    }
  }

  function openPassage(id) {
    currentPassage = window.HSK_READING_getById(id);
    if (!currentPassage) return;
    $("#readListView").classList.add("hidden");
    $("#readArticleView").classList.remove("hidden");
    $("#articleLevel").textContent = currentPassage.level.toUpperCase() + " · " + currentPassage.minutes + " phút đọc";
    $("#articleTitle").textContent = currentPassage.title;
    $("#articleTitleVi").textContent = currentPassage.title_vi;
    $("#readTranslationBox").classList.remove("open");
    $("#readTranslationBox").textContent = currentPassage.translation_vi;
    showPinyin = false;
    $("#togglePinyinBtn").textContent = "拼 Hiện Pinyin";
    renderPassageText();
    renderQuiz();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backToList() {
    $("#readArticleView").classList.add("hidden");
    $("#readListView").classList.remove("hidden");
    renderPassageGrid();
  }

  function getFullText() {
    return currentPassage.sentences.map(s => s.map(t => t.h).join("")).join("");
  }

  function initReadModeTabs() {
    document.querySelectorAll("[data-readmode]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-readmode]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const mode = btn.dataset.readmode;
        document.getElementById("readLibraryView").classList.toggle("hidden", mode !== "library");
        document.getElementById("readCustomView").classList.toggle("hidden", mode !== "custom");
        if (mode === "custom" && window.HSK_ReadingCustom) {
          window.HSK_ReadingCustom.init();
        }
      });
    });
  }

  function init() {
    renderLevelTabs();
    renderPassageGrid();
    updateSummary();
    initReadModeTabs();

    $("#backToListBtn").addEventListener("click", backToList);
    $("#submitQuizBtn").addEventListener("click", submitQuiz);

    $("#togglePinyinBtn").addEventListener("click", () => {
      showPinyin = !showPinyin;
      document.querySelector("#togglePinyinBtn").textContent = showPinyin ? "拼 Ẩn Pinyin" : "拼 Hiện Pinyin";
      renderPassageText();
    });
    $("#toggleTranslationBtn").addEventListener("click", () => {
      $("#readTranslationBox").classList.toggle("open");
    });
    $("#playAllBtn").addEventListener("click", () => window.HSK_TTS.speak(getFullText()));
    $("#playSlowBtn").addEventListener("click", () => window.HSK_TTS.speakSlow(getFullText()));

    const params = new URLSearchParams(window.location.search);
    const wantId = params.get("id");
    if (wantId) openPassage(wantId);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
