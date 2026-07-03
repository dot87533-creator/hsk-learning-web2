/* vocabulary.js — Logic trang Tu vung: grid/list view, search, filter, sort,
   bookmark/favorite/learned/needReview, recently viewed, flashcard mode,
   pagination + infinite scroll, modal chi tiet tu (pinyin, but thu, stroke order, vi du). */
(function () {
  "use strict";
  const { requireAuth, Toast, Modal, Store } = window.HSK;

  const PAGE_SIZE = 12;
  const SVG_BOOKMARK = '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>';
  const SVG_HEART = '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"/></svg>';
  const SVG_LEARNED = '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4" fill="none"><path d="M20 6L9 17l-5-5"/></svg>';
  const SVG_REVIEW = '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>';
  const SVG_AUDIO = '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19 5a9 9 0 010 14M15.5 8.5a4.5 4.5 0 010 7"/></svg>';

  let user = null;
  let allWords = [];
  let filtered = [];
  let view = "grid";
  let mode = "infinite"; // 'infinite' | 'pagination'
  let loadedCount = PAGE_SIZE;
  let currentPage = 1;
  let observer = null;

  const filters = { search: "", levels: new Set(), statuses: new Set(), wordTypes: new Set(), difficulties: new Set() };
  let sortMode = "default";

  /* ---------------- Helpers ---------------- */
  function slug(s) { return (s || "").toLowerCase().replace(/\s+/g, "-"); }

  function withState(w) {
    const st = window.HSK_VocabState.getState(w.id);
    return Object.assign({}, w, st);
  }

  function recentKey() { return "hsk_recent_vocab_" + (user ? user.email : "guest"); }

  function addRecentlyViewed(id) {
    let list = Store.get(recentKey(), []);
    list = list.filter(x => x !== id);
    list.unshift(id);
    if (list.length > 16) list.length = 16;
    Store.set(recentKey(), list);
    renderRecent();
  }

  /* ---------------- Init ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    user = requireAuth();
    if (!user) return;

    allWords = window.HSK_getAllWords();
    buildChips();
    bindToolbar();
    bindModeSwitch();
    bindFlashcard();
    setupObserver();
    renderRecent();
    applyFromUrlQuery();
    applyAndRender();
  });

  /* Nhận từ khoá tìm kiếm được chuyển tới từ ô "Tra từ điển" trên navbar (?q=...) */
  function applyFromUrlQuery() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (!q) return;
    const input = document.getElementById("vocabSearchInput");
    input.value = q;
    document.getElementById("searchBoxWrap").classList.add("has-value");
    filters.search = q.trim().toLowerCase();
    Toast.info("Đã tìm trong từ điển", 'Kết quả cho "' + q + '"');
    // Xoá query khỏi URL để làm mới không tìm lại khi reload
    history.replaceState(null, "", window.location.pathname);
  }

  /* ---------------- Chips (Level / Word type / Difficulty) ---------------- */
  function buildChips() {
    const levelWrap = document.getElementById("levelChips");
    levelWrap.innerHTML = window.HSK_LEVEL_META.map(lv => {
      const count = (window.HSK_VOCAB[lv.id] || []).length;
      if (!count) return "";
      return `<button class="chip level-chip" data-level="${lv.id}">${lv.name} <span class="chip-count">${count}</span></button>`;
    }).join("");

    const typeSet = {};
    const diffSet = {};
    allWords.forEach(w => {
      typeSet[w.word_type] = (typeSet[w.word_type] || 0) + 1;
      diffSet[w.difficulty] = (diffSet[w.difficulty] || 0) + 1;
    });
    const diffOrder = ["Rất dễ", "Dễ", "Trung bình", "Khó", "Rất khó", "Cực khó"];

    document.getElementById("wordTypeChips").innerHTML = Object.keys(typeSet).sort().map(t =>
      `<button class="chip type-chip" data-type="${t}">${t} <span class="chip-count">${typeSet[t]}</span></button>`
    ).join("");

    document.getElementById("difficultyChips").innerHTML = diffOrder.filter(d => diffSet[d]).map(d =>
      `<button class="chip diff-chip" data-diff="${d}">${d} <span class="chip-count">${diffSet[d]}</span></button>`
    ).join("");

    document.querySelectorAll(".chip").forEach(chip => {
      chip.addEventListener("click", () => {
        chip.classList.toggle("active");
        const { level, type, diff, status } = chip.dataset;
        if (level) toggleSetVal(filters.levels, level);
        else if (type) toggleSetVal(filters.wordTypes, type);
        else if (diff) toggleSetVal(filters.difficulties, diff);
        else if (status) toggleSetVal(filters.statuses, status);
        applyAndRender();
      });
    });

    document.getElementById("resetFiltersBtn").addEventListener("click", () => {
      filters.search = ""; filters.levels.clear(); filters.statuses.clear(); filters.wordTypes.clear(); filters.difficulties.clear();
      document.getElementById("vocabSearchInput").value = "";
      document.getElementById("searchBoxWrap").classList.remove("has-value");
      document.getElementById("sortSelect").value = "default"; sortMode = "default";
      document.querySelectorAll(".chip.active").forEach(c => c.classList.remove("active"));
      applyAndRender();
      Toast.info("Đã đặt lại bộ lọc");
    });
  }

  function toggleSetVal(set, val) { set.has(val) ? set.delete(val) : set.add(val); }

  /* ---------------- Toolbar: search / sort / view ---------------- */
  function bindToolbar() {
    const input = document.getElementById("vocabSearchInput");
    const wrap = document.getElementById("searchBoxWrap");
    let t;
    input.addEventListener("input", () => {
      wrap.classList.toggle("has-value", !!input.value);
      clearTimeout(t);
      t = setTimeout(() => { filters.search = input.value.trim().toLowerCase(); applyAndRender(); }, 280);
    });
    document.getElementById("clearSearchBtn").addEventListener("click", () => {
      input.value = ""; wrap.classList.remove("has-value"); filters.search = ""; applyAndRender(); input.focus();
    });

    document.getElementById("sortSelect").addEventListener("change", e => {
      sortMode = e.target.value; applyAndRender();
    });

    document.getElementById("gridViewBtn").addEventListener("click", () => setView("grid"));
    document.getElementById("listViewBtn").addEventListener("click", () => setView("list"));

    document.getElementById("openFlashcardBtn").addEventListener("click", () => openFlashcards());
  }

  function setView(v) {
    view = v;
    document.getElementById("gridViewBtn").classList.toggle("active", v === "grid");
    document.getElementById("listViewBtn").classList.toggle("active", v === "list");
    document.getElementById("vocabGrid").classList.toggle("hidden", v !== "grid");
    document.getElementById("vocabList").classList.toggle("hidden", v !== "list");
    renderVisible();
  }

  function bindModeSwitch() {
    document.getElementById("infiniteToggle").addEventListener("change", e => {
      mode = e.target.checked ? "infinite" : "pagination";
      resetPagingState();
      renderVisible();
    });
    document.getElementById("loadMoreBtn").addEventListener("click", () => loadMore());
  }

  /* ---------------- Filtering / sorting ---------------- */
  function applyAndRender() {
    filtered = allWords.map(withState).filter(w => {
      if (filters.search) {
        const s = filters.search;
        const hay = (w.hanzi + " " + w.pinyin + " " + w.meaning_vi + " " + w.meaning_en).toLowerCase();
        if (!hay.includes(s)) return false;
      }
      if (filters.levels.size && !filters.levels.has(w.level)) return false;
      if (filters.wordTypes.size && !filters.wordTypes.has(w.word_type)) return false;
      if (filters.difficulties.size && !filters.difficulties.has(w.difficulty)) return false;
      if (filters.statuses.size) {
        for (const st of filters.statuses) { if (!w[st]) return false; }
      }
      return true;
    });

    const diffRank = { "Rất dễ": 0, "Dễ": 1, "Trung bình": 2, "Khó": 3, "Rất khó": 4, "Cực khó": 5 };
    if (sortMode === "hanzi-asc") filtered.sort((a, b) => a.hanzi.localeCompare(b.hanzi, "zh"));
    else if (sortMode === "pinyin-asc") filtered.sort((a, b) => a.pinyin.localeCompare(b.pinyin));
    else if (sortMode === "difficulty-asc") filtered.sort((a, b) => diffRank[a.difficulty] - diffRank[b.difficulty]);
    else if (sortMode === "difficulty-desc") filtered.sort((a, b) => diffRank[b.difficulty] - diffRank[a.difficulty]);
    else if (sortMode === "stroke-asc") filtered.sort((a, b) => a.stroke_count - b.stroke_count);
    else if (sortMode === "stroke-desc") filtered.sort((a, b) => b.stroke_count - a.stroke_count);

    document.getElementById("resultCount").textContent = filtered.length.toLocaleString("vi-VN");
    resetPagingState();
    renderVisible();
  }

  function resetPagingState() { loadedCount = PAGE_SIZE; currentPage = 1; }

  /* ---------------- Rendering ---------------- */
  function renderVisible() {
    const empty = document.getElementById("vocabEmpty");
    const gridEl = document.getElementById("vocabGrid");
    const listEl = document.getElementById("vocabList");
    const loadWrap = document.getElementById("loadMoreWrap");
    const pagerWrap = document.getElementById("pagerWrap");

    if (!filtered.length) {
      empty.classList.remove("hidden");
      gridEl.innerHTML = ""; listEl.innerHTML = "";
      loadWrap.classList.add("hidden"); pagerWrap.classList.add("hidden");
      return;
    }
    empty.classList.add("hidden");

    let pageItems;
    if (mode === "infinite") {
      pageItems = filtered.slice(0, loadedCount);
      pagerWrap.classList.add("hidden");
      loadWrap.classList.remove("hidden");
      document.getElementById("loadMoreBtn").classList.toggle("hidden", loadedCount >= filtered.length);
    } else {
      const start = (currentPage - 1) * PAGE_SIZE;
      pageItems = filtered.slice(start, start + PAGE_SIZE);
      loadWrap.classList.add("hidden");
      pagerWrap.classList.remove("hidden");
      renderPager();
    }

    if (view === "grid") { gridEl.innerHTML = pageItems.map(cardHtml).join(""); listEl.innerHTML = ""; }
    else { listEl.innerHTML = pageItems.map(rowHtml).join(""); gridEl.innerHTML = ""; }

    bindCardEvents();
  }

  function diffTagClass(d) { return "diff-" + slug(d); }

  function cardHtml(w, i) {
    return `
    <article class="vocab-card" data-id="${w.id}" style="animation-delay:${Math.min(i, 14) * 35}ms">
      <div class="vc-top">
        <span class="vc-level-tag">${w.level.replace("hsk", "HSK ")}</span>
        <div class="vc-quick-actions">
          <button class="vc-icon-btn audio-btn" data-action="audio" aria-label="Phát âm" title="Phát âm">${SVG_AUDIO}</button>
          <button class="vc-icon-btn bookmark-btn ${w.bookmarked ? "is-on" : ""}" data-action="bookmark" aria-label="Đánh dấu" title="Đánh dấu">${SVG_BOOKMARK}</button>
          <button class="vc-icon-btn favorite-btn ${w.favorite ? "is-on" : ""}" data-action="favorite" aria-label="Yêu thích" title="Yêu thích">${SVG_HEART}</button>
        </div>
      </div>
      <div class="vc-hanzi">${w.hanzi}</div>
      <div class="vc-pinyin">${w.pinyin}</div>
      <div class="vc-meaning">${w.meaning_vi}</div>
      <div class="vc-tags">
        <span class="vc-tag">${w.word_type}</span>
        <span class="vc-tag ${diffTagClass(w.difficulty)}">${w.difficulty}</span>
        <span class="vc-tag">${w.stroke_count} nét</span>
      </div>
      <div class="vc-status-row">
        ${w.learned ? `<span class="vc-status-pill learned">${SVG_LEARNED} Đã thuộc</span>` : ""}
        ${w.needReview ? `<span class="vc-status-pill needReview">${SVG_REVIEW} Cần ôn</span>` : ""}
      </div>
    </article>`;
  }

  function rowHtml(w, i) {
    return `
    <article class="vocab-row" data-id="${w.id}" style="animation-delay:${Math.min(i, 14) * 25}ms">
      <span class="vr-hanzi">${w.hanzi}</span>
      <div class="vr-info">
        <div class="vr-pinyin">${w.pinyin}</div>
        <div class="vr-meaning">${w.meaning_vi}</div>
      </div>
      <div class="vr-meta">
        <span class="vc-tag">${w.level.replace("hsk", "HSK ")}</span>
        <span class="vc-tag">${w.word_type}</span>
        <span class="vc-tag ${diffTagClass(w.difficulty)}">${w.difficulty}</span>
        ${w.learned ? `<span class="vc-status-pill learned">${SVG_LEARNED}</span>` : ""}
        ${w.needReview ? `<span class="vc-status-pill needReview">${SVG_REVIEW}</span>` : ""}
      </div>
      <div class="vr-actions">
        <button class="vc-icon-btn audio-btn" data-action="audio" aria-label="Phát âm">${SVG_AUDIO}</button>
        <button class="vc-icon-btn bookmark-btn ${w.bookmarked ? "is-on" : ""}" data-action="bookmark" aria-label="Đánh dấu">${SVG_BOOKMARK}</button>
        <button class="vc-icon-btn favorite-btn ${w.favorite ? "is-on" : ""}" data-action="favorite" aria-label="Yêu thích">${SVG_HEART}</button>
      </div>
    </article>`;
  }

  function bindCardEvents() {
    document.querySelectorAll(".vocab-card, .vocab-row").forEach(el => {
      el.addEventListener("click", e => {
        const actionBtn = e.target.closest("[data-action]");
        const id = el.dataset.id;
        if (actionBtn) {
          e.stopPropagation();
          const action = actionBtn.dataset.action;
          if (action === "audio") playAudio(id, actionBtn);
          else if (action === "bookmark") { const on = window.HSK_VocabState.toggleBookmark(id); actionBtn.classList.toggle("is-on", on); syncIfFiltered(); }
          else if (action === "favorite") { const on = window.HSK_VocabState.toggleFavorite(id); actionBtn.classList.toggle("is-on", on); syncIfFiltered(); }
          return;
        }
        openDetail(id);
      });
    });
  }

  function syncIfFiltered() {
    // neu dang loc theo trang thai (bookmarked/favorite/...) thi can render lai de loai bo muc khong con thoa dieu kien
    if (filters.statuses.size) applyAndRender();
  }

  function playAudio(id, btn) {
    const w = window.HSK_getWordById(id);
    if (!w) return;
    btn && btn.classList.add("playing");
    window.HSK_TTS.speak(w.audio && w.audio.text ? w.audio.text : w.hanzi, {
      onEnd: () => btn && btn.classList.remove("playing")
    });
  }

  /* ---------------- Pagination ---------------- */
  function renderPager() {
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    const pager = document.getElementById("pagerWrap");
    let pages = [];
    const win = 1;
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || (p >= currentPage - win && p <= currentPage + win)) pages.push(p);
      else if (pages[pages.length - 1] !== "…") pages.push("…");
    }
    let html = `<button class="page-btn" id="pagerPrev" ${currentPage === 1 ? "disabled" : ""} aria-label="Trang trước">‹</button>`;
    html += pages.map(p => p === "…" ? `<span class="page-btn" style="border:0;background:none;cursor:default">…</span>` :
      `<button class="page-btn ${p === currentPage ? "active" : ""}" data-page="${p}">${p}</button>`).join("");
    html += `<button class="page-btn" id="pagerNext" ${currentPage === totalPages ? "disabled" : ""} aria-label="Trang sau">›</button>`;
    pager.innerHTML = html;

    pager.querySelectorAll("[data-page]").forEach(b => b.addEventListener("click", () => { currentPage = +b.dataset.page; renderVisible(); window.scrollTo({ top: document.querySelector(".vocab-toolbar").offsetTop - 100, behavior: "smooth" }); }));
    const prev = document.getElementById("pagerPrev"); if (prev) prev.addEventListener("click", () => { if (currentPage > 1) { currentPage--; renderVisible(); } });
    const next = document.getElementById("pagerNext"); if (next) next.addEventListener("click", () => { if (currentPage < totalPages) { currentPage++; renderVisible(); } });
  }

  /* ---------------- Infinite scroll ---------------- */
  function setupObserver() {
    observer = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting && mode === "infinite") loadMore(); });
    }, { rootMargin: "200px" });
    observer.observe(document.getElementById("scrollSentinel"));
  }

  function loadMore() {
    if (mode !== "infinite" || loadedCount >= filtered.length) return;
    const spinner = document.getElementById("loadSpinner");
    spinner.classList.remove("hidden");
    setTimeout(() => {
      loadedCount = Math.min(filtered.length, loadedCount + PAGE_SIZE);
      spinner.classList.add("hidden");
      renderVisible();
    }, 350);
  }

  /* ---------------- Recently viewed ---------------- */
  function renderRecent() {
    const ids = Store.get(recentKey(), []);
    const wrap = document.getElementById("recentWrap");
    if (!ids.length) { wrap.classList.add("hidden"); return; }
    wrap.classList.remove("hidden");
    document.getElementById("recentStrip").innerHTML = ids.map(id => {
      const w = window.HSK_getWordById(id);
      if (!w) return "";
      return `<div class="recent-chip" data-id="${w.id}"><span class="rc-hanzi">${w.hanzi}</span><span class="rc-pinyin">${w.pinyin}</span></div>`;
    }).join("");
    document.querySelectorAll(".recent-chip").forEach(c => c.addEventListener("click", () => openDetail(c.dataset.id)));
  }

  /* ---------------- Word Detail Modal ---------------- */
  function openDetail(id) {
    const base = window.HSK_getWordById(id);
    if (!base) return;
    addRecentlyViewed(id);
    renderDetailModal(id);
  }

  function renderDetailModal(id) {
    const w = withState(window.HSK_getWordById(id));
    Modal.open({
      title: "Chi tiết từ vựng",
      body: `
        <div class="wd-head">
          <div class="wd-hanzi">${w.hanzi}</div>
          <div>
            <div class="wd-pinyin-row">
              <span class="wd-pinyin">${w.pinyin}</span>
              <button class="vc-icon-btn audio-btn" id="wdAudioBtn" aria-label="Phát âm" title="Phát âm">${SVG_AUDIO}</button>
            </div>
            <div class="wd-meaning-vi">${w.meaning_vi} <span class="muted">· ${w.meaning_en}</span></div>
            <div class="vc-tags" style="margin-top:8px">
              <span class="vc-tag">${w.level.replace("hsk", "HSK ")}</span>
              <span class="vc-tag">${w.word_type}</span>
              <span class="vc-tag ${diffTagClass(w.difficulty)}">${w.difficulty}</span>
            </div>
          </div>
        </div>

        <div class="wd-section">
          <h4>Bộ thủ &amp; Số nét</h4>
          <div class="wd-grid-2">
            <div class="wd-info-box"><b>Bộ thủ</b>${w.radical} — ${w.radical_meaning}</div>
            <div class="wd-info-box"><b>Số nét</b>${w.stroke_count} nét</div>
          </div>
        </div>

        <div class="wd-section">
          <h4>Thứ tự nét bút (Stroke order)</h4>
          <div class="stroke-order-box">${w.stroke_order}</div>
        </div>

        <div class="wd-section">
          <h4>Câu ví dụ</h4>
          <div class="wd-example-list">
            ${(window.HSK_getExampleSentences ? window.HSK_getExampleSentences(w, 3) : []).map(ex => `
              <div class="wd-example-box">
                <div class="wd-example-zh">${ex.zh} <span class="wd-example-pinyin">(${ex.pinyin})</span></div>
                <div class="wd-example-vi">${ex.vi}</div>
                <div class="wd-example-actions">
                  <a class="btn btn-soft btn-sm" href="writing.html?sentence=${encodeURIComponent(ex.zh)}&sentencePinyin=${encodeURIComponent(ex.pinyin || "")}&sentenceVi=${encodeURIComponent(ex.vi || "")}">✍️ Luyện viết câu này</a>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        ${w.note ? `<div class="wd-section"><h4>Ghi chú</h4><div class="wd-note-box">💡 ${w.note}</div></div>` : ""}

        <div class="wd-section wd-usernote">
          <h4>Ghi chú cá nhân</h4>
          <textarea id="wdUserNote" placeholder="Viết ghi chú của riêng bạn cho từ này…">${w.userNote || ""}</textarea>
        </div>

        <div class="wd-actions-row">
          <button class="btn ${w.bookmarked ? "btn-primary" : "btn-soft"}" id="wdBookmarkBtn">🔖 Đánh dấu</button>
          <button class="btn ${w.favorite ? "btn-primary" : "btn-soft"}" id="wdFavoriteBtn">❤️ Yêu thích</button>
          <button class="btn ${w.needReview ? "btn-primary" : "btn-soft"}" id="wdReviewBtn">🔁 Cần ôn</button>
          <button class="btn ${w.learned ? "btn-primary" : "btn-soft"}" id="wdLearnedBtn">✅ Đã thuộc</button>
        </div>
      `,
      actions: [{ label: "Đóng", cls: "btn-ghost" }]
    });

    setTimeout(() => {
      const audioBtn = document.getElementById("wdAudioBtn");
      if (audioBtn) audioBtn.addEventListener("click", () => playAudio(w.id, audioBtn));

      const noteEl = document.getElementById("wdUserNote");
      if (noteEl) noteEl.addEventListener("blur", () => { window.HSK_VocabState.setNote(w.id, noteEl.value); });

      const bk = document.getElementById("wdBookmarkBtn");
      if (bk) bk.addEventListener("click", () => { const on = window.HSK_VocabState.toggleBookmark(w.id); bk.className = "btn " + (on ? "btn-primary" : "btn-soft"); applyAndRender(); });

      const fav = document.getElementById("wdFavoriteBtn");
      if (fav) fav.addEventListener("click", () => { const on = window.HSK_VocabState.toggleFavorite(w.id); fav.className = "btn " + (on ? "btn-primary" : "btn-soft"); applyAndRender(); });

      const rev = document.getElementById("wdReviewBtn");
      if (rev) rev.addEventListener("click", () => { const e = window.HSK_VocabState.markNeedReview(w.id, !window.HSK_VocabState.getState(w.id).needReview); rev.className = "btn " + (e.needReview ? "btn-primary" : "btn-soft"); applyAndRender(); });

      const lrn = document.getElementById("wdLearnedBtn");
      if (lrn) lrn.addEventListener("click", () => { const e = window.HSK_VocabState.markLearned(w.id, !window.HSK_VocabState.getState(w.id).learned); lrn.className = "btn " + (e.learned ? "btn-primary" : "btn-soft"); Toast.success(e.learned ? "Đã đánh dấu thuộc!" : "Đã bỏ đánh dấu thuộc"); applyAndRender(); });
    }, 30);
  }

  /* ================= FLASHCARD MODE ================= */
  let fcList = [];
  let fcIndex = 0;
  let fcScope = "filtered"; // filtered | review | unlearned

  function bindFlashcard() {
    document.getElementById("fcCloseBtn").addEventListener("click", closeFlashcards);
    document.getElementById("flashcardOverlay").addEventListener("click", e => { if (e.target.id === "flashcardOverlay") closeFlashcards(); });
    document.getElementById("flashcard").addEventListener("click", flipCard);
    document.getElementById("fcFlipBtn").addEventListener("click", flipCard);
    document.getElementById("fcPrevBtn").addEventListener("click", () => stepCard(-1));
    document.getElementById("fcNextBtn").addEventListener("click", () => stepCard(1));
    document.getElementById("fcShuffleBtn").addEventListener("click", shuffleCards);
    document.getElementById("fcAudioBtn").addEventListener("click", e => { e.stopPropagation(); const w = fcList[fcIndex]; if (w) playAudio(w.id, e.currentTarget); });
    document.getElementById("fcMarkLearned").addEventListener("click", () => { const w = fcList[fcIndex]; if (w) { window.HSK_VocabState.markLearned(w.id, true); Toast.success("Đã thuộc!", w.hanzi); advanceAfterMark(); } });
    document.getElementById("fcMarkReview").addEventListener("click", () => { const w = fcList[fcIndex]; if (w) { window.HSK_VocabState.markNeedReview(w.id, true); Toast.info("Đã đánh dấu cần ôn", w.hanzi); advanceAfterMark(); } });
    document.getElementById("fcScopeBtn").addEventListener("click", cycleScope);

    document.addEventListener("keydown", e => {
      if (!document.getElementById("flashcardOverlay").classList.contains("open")) return;
      if (e.key === "Escape") closeFlashcards();
      else if (e.key === "ArrowRight") stepCard(1);
      else if (e.key === "ArrowLeft") stepCard(-1);
      else if (e.key === " ") { e.preventDefault(); flipCard(); }
    });
  }

  function cycleScope() {
    fcScope = fcScope === "filtered" ? "review" : fcScope === "review" ? "unlearned" : "filtered";
    const labels = { filtered: "📚 Đang học: Tất cả kết quả lọc", review: "🔁 Đang học: Cần ôn lại", unlearned: "📖 Đang học: Chưa thuộc" };
    document.getElementById("fcScopeBtn").textContent = labels[fcScope];
    buildFcList();
  }

  function buildFcList() {
    let base = filtered.length ? filtered : allWords.map(withState);
    if (fcScope === "review") base = base.filter(w => w.needReview);
    else if (fcScope === "unlearned") base = base.filter(w => !w.learned);
    fcList = base.slice();
    fcIndex = 0;
    document.getElementById("flashcard").classList.remove("flipped");
    renderFcCard();
  }

  function openFlashcards() {
    document.getElementById("flashcardOverlay").classList.add("open");
    document.body.style.overflow = "hidden";
    fcScope = "filtered";
    document.getElementById("fcScopeBtn").textContent = "📚 Đang học: Tất cả kết quả lọc";
    buildFcList();
  }
  function closeFlashcards() {
    document.getElementById("flashcardOverlay").classList.remove("open");
    document.body.style.overflow = "";
    window.HSK_TTS.stop();
  }

  function flipCard() { document.getElementById("flashcard").classList.toggle("flipped"); }

  function stepCard(dir) {
    if (!fcList.length) return;
    document.getElementById("flashcard").classList.remove("flipped");
    fcIndex = (fcIndex + dir + fcList.length) % fcList.length;
    setTimeout(renderFcCard, 120);
  }

  function advanceAfterMark() {
    applyAndRender();
    if (fcList.length > 1) stepCard(1); else renderFcCard();
  }

  function shuffleCards() {
    for (let i = fcList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = fcList[i]; fcList[i] = fcList[j]; fcList[j] = tmp;
    }
    fcIndex = 0;
    document.getElementById("flashcard").classList.remove("flipped");
    renderFcCard();
    document.getElementById("fcShuffleBtn").classList.add("active");
    setTimeout(() => document.getElementById("fcShuffleBtn").classList.remove("active"), 600);
  }

  function renderFcCard() {
    const counter = document.getElementById("fcCounter");
    const bar = document.getElementById("fcProgressBar");
    const emptyMsg = document.getElementById("fcEmptyMsg");
    const cardEl = document.getElementById("flashcard");
    const markRow = document.querySelector(".fc-mark-row");
    if (!fcList.length) {
      emptyMsg.classList.remove("hidden");
      cardEl.classList.add("hidden");
      markRow.classList.add("hidden");
      counter.textContent = "0 / 0"; bar.style.width = "0%";
      return;
    }
    emptyMsg.classList.add("hidden");
    cardEl.classList.remove("hidden");
    markRow.classList.remove("hidden");
    const w = fcList[fcIndex];
    counter.textContent = (fcIndex + 1) + " / " + fcList.length;
    bar.style.width = Math.round(((fcIndex + 1) / fcList.length) * 100) + "%";
    document.getElementById("fcHanzi").textContent = w.hanzi;
    document.getElementById("fcPinyin").textContent = w.pinyin;
    document.getElementById("fcMeaningVi").textContent = w.meaning_vi;
    document.getElementById("fcMeaningEn").textContent = w.meaning_en;
    const fcExamples = window.HSK_getExampleSentences ? window.HSK_getExampleSentences(w, 2) : [];
    document.getElementById("fcExampleList").innerHTML = fcExamples.map(ex => `
      <div class="wd-example-box">
        <div class="wd-example-zh">${ex.zh} <span class="wd-example-pinyin">(${ex.pinyin})</span></div>
        <div class="wd-example-vi">${ex.vi}</div>
      </div>
    `).join("");
  }
})();
