/* writing.js — Trang Luyện viết: dùng thư viện Hanzi Writer (dữ liệu nét chữ tải qua CDN)
   để hiển thị hoạt ảnh thứ tự nét và chế độ tự vẽ (quiz) có chấm điểm tự động. */
(function () {
  "use strict";

  const $ = sel => document.querySelector(sel);
  const CANVAS_SIZE = 300;

  let filteredList = [];
  let currentIndex = 0;
  let writer = null;
  let currentUiMode = "animate";
  let quizMistakes = 0;
  let quizStrokesTotal = 0;
  let sentenceMode = null;   // { zh, vi, pinyin } khi dang luyen 1 cau vi du
  let sentenceBackup = null; // { list, index } de khoi phuc khi thoat

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function isHanziChar(ch) {
    return /[\u3400-\u9FFF]/.test(ch);
  }

  function buildCharListForLevel(levelId) {
    const words = levelId === "all"
      ? window.HSK_getAllWords()
      : (window.HSK_VOCAB[levelId] || []);
    const seen = new Map();
    words.forEach(w => {
      const chars = w.hanzi.split("");
      const pinyinParts = w.pinyin.split(/\s+/);
      chars.forEach((ch, i) => {
        if (!isHanziChar(ch) || seen.has(ch)) return;
        seen.set(ch, {
          char: ch,
          pinyin: pinyinParts[i] || w.pinyin,
          meaning: w.meaning_vi,
          wordHanzi: w.hanzi,
          level: w.level
        });
      });
    });
    return Array.from(seen.values());
  }

  function populateLevelSelect() {
    const sel = $("#writeLevelSelect");
    sel.innerHTML = `<option value="all">Tất cả cấp độ</option>` +
      window.HSK_LEVEL_META.map(l => `<option value="${l.id}">${l.name}</option>`).join("");
  }

  function renderCharList() {
    const wrap = $("#writeCharList");
    $("#writeListCount").textContent = filteredList.length + " chữ";
    if (!filteredList.length) {
      wrap.innerHTML = `<p class="muted" style="font-size:.85rem;padding:10px">Không tìm thấy chữ nào.</p>`;
      return;
    }
    wrap.innerHTML = filteredList.map((c, i) => `
      <div class="write-char-item ${i === currentIndex ? "active" : ""}" data-idx="${i}">
        <span class="wc-char">${escapeHtml(c.char)}</span>
        <div class="wc-meta">
          <div class="wc-pinyin">${escapeHtml(c.pinyin)}</div>
          <div class="wc-meaning">${escapeHtml(c.meaning)}</div>
        </div>
        ${window.HSK_WritingState.isMastered(c.char) ? '<span class="wc-done">✓</span>' : ""}
      </div>
    `).join("");
    wrap.querySelectorAll(".write-char-item").forEach(el => {
      el.addEventListener("click", () => loadCharAt(+el.dataset.idx));
    });
  }

  function refreshStats() {
    const s = window.HSK_WritingState.getSummary();
    $("#statPracticed").textContent = s.practicedCount;
    $("#statMastered").textContent = s.masteredCount;
    $("#statAccuracy").textContent = s.accuracy === null ? "—" : s.accuracy + "%";
  }

  function createWriterInstance(char) {
    const wrap = $("#writeCanvasWrap");
    wrap.innerHTML = `<div class="write-char-box" id="hanziTarget" style="width:${CANVAS_SIZE}px;height:${CANVAS_SIZE}px"></div>`;
    $("#writeFeedback").textContent = "";
    $("#writeFeedback").className = "write-quiz-feedback";

    function showLibError(reason) {
      wrap.innerHTML = `
        <div class="muted" style="padding:30px;text-align:center">
          <p style="margin-bottom:12px">⚠️ Không tải được thư viện hoạt ảnh viết chữ${reason ? " (" + escapeHtml(reason) + ")" : ""}.<br>
          Nếu bạn đang mở trong Zalo/Facebook/TikTok…, trình duyệt trong ứng dụng đó có thể đang chặn kết nối tới thư viện.
          Hãy thử mở trang này bằng Safari/Chrome, hoặc kiểm tra lại kết nối mạng.</p>
          <button class="btn btn-soft btn-sm" id="writeRetryBtn" type="button">↻ Thử tải lại</button>
        </div>`;
      const retryBtn = document.getElementById("writeRetryBtn");
      if (retryBtn) retryBtn.addEventListener("click", () => createWriterInstance(char));
    }

    if (typeof HanziWriter === "undefined") {
      showLibError("thư viện chưa sẵn sàng");
      return;
    }

    try {
        writer = HanziWriter.create("hanziTarget", char, {
        width: CANVAS_SIZE, height: CANVAS_SIZE, padding: 18,
        showOutline: true,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 200,
        strokeColor: getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#1F1B16",
        outlineColor: getComputedStyle(document.documentElement).getPropertyValue("--line-strong").trim() || "#ccc",
        drawingColor: getComputedStyle(document.documentElement).getPropertyValue("--seal").trim() || "#B33A3A",
        onLoadCharDataError: function () {
          showLibError("không tìm thấy dữ liệu nét chữ cho \"" + char + "\"");
        }
      });
    } catch (err) {
      showLibError(err && err.message);
      return;
    }

    if (currentUiMode === "animate") startAnimateMode();
    else startQuizMode();
  }

  function startAnimateMode() {
    currentUiMode = "animate";
    $("#animateControls").classList.remove("hidden");
    $("#quizControls").classList.add("hidden");
    document.querySelectorAll(".write-mode-tabs .tab-btn").forEach(b => b.classList.toggle("active", b.dataset.writemode === "animate"));
    if (!writer) return;
    writer.showCharacter();
    writer.showOutline();
    setTimeout(() => writer.animateCharacter(), 250);
  }

  function startQuizMode() {
    currentUiMode = "quiz";
    $("#animateControls").classList.add("hidden");
    $("#quizControls").classList.remove("hidden");
    document.querySelectorAll(".write-mode-tabs .tab-btn").forEach(b => b.classList.toggle("active", b.dataset.writemode === "quiz"));
    if (!writer) return;
    quizMistakes = 0;
    const fb = $("#writeFeedback");
    fb.textContent = "Vẽ từng nét theo đúng thứ tự vào ô bên trên…";
    fb.className = "write-quiz-feedback";

    writer.quiz({
      onMistake: function () {
        quizMistakes++;
        fb.textContent = "Chưa đúng nét, thử lại nhé!";
        fb.className = "write-quiz-feedback err";
      },
      onCorrectStroke: function (data) {
        fb.textContent = `Đúng! (${data.strokeNum + 1}/${data.strokesRemaining + data.strokeNum + 1} nét)`;
        fb.className = "write-quiz-feedback ok";
      },
      onComplete: function (summary) {
        const current = filteredList[currentIndex];
        quizStrokesTotal = summary.totalStrokes || summary.strokeNum || 0;
        window.HSK_WritingState.recordQuizResult(current.char, quizStrokesTotal || 1, quizMistakes);
        fb.textContent = quizMistakes === 0
          ? "🎉 Hoàn hảo! Bạn viết đúng toàn bộ nét ngay lần đầu."
          : `✅ Hoàn thành với ${quizMistakes} lần sai. Luyện thêm để đạt hoàn hảo!`;
        fb.className = "write-quiz-feedback " + (quizMistakes === 0 ? "ok" : "");
        refreshStats();
        renderCharList();
        if (window.HSK_VocabState) {
          window.HSK_VocabState.logActivity({ type: "writing", levelOrSkill: current.level || "", detail: "Luyện viết chữ " + current.char, score: quizMistakes === 0 ? 100 : Math.max(40, 100 - quizMistakes * 15), durationSec: 30 });
        }
        window.HSK.Toast && window.HSK.Toast.success("Đã lưu tiến độ", "Chữ \"" + current.char + "\" đã được ghi nhận vào lịch sử luyện viết.");
      }
    });
  }

  /* Tim pinyin/nghia gan dung nhat cho 1 chu Han rieng le trich tu 1 cau vi du,
     dung de dua vao hang doi luyen viet theo cau. */
  function buildEntryForChar(ch) {
    const all = window.HSK_getAllWords ? window.HSK_getAllWords() : [];
    const exact = all.find(w => w.hanzi === ch);
    if (exact) {
      return { char: ch, pinyin: exact.pinyin, meaning: exact.meaning_vi, wordHanzi: exact.hanzi, level: exact.level };
    }
    const containing = all.find(w => w.hanzi.includes(ch));
    if (containing) {
      const idx = containing.hanzi.indexOf(ch);
      const pinyinParts = containing.pinyin.split(/\s+/);
      return { char: ch, pinyin: pinyinParts[idx] || containing.pinyin, meaning: containing.meaning_vi, wordHanzi: containing.hanzi, level: containing.level };
    }
    return { char: ch, pinyin: "", meaning: "", wordHanzi: ch, level: "" };
  }

  function updateSentenceBanner() {
    const banner = $("#sentenceBanner");
    if (!sentenceMode) { banner.classList.add("hidden"); return; }
    banner.classList.remove("hidden");
    $("#spbSentence").textContent = sentenceMode.zh;
    $("#spbProgress").textContent = `Chữ ${currentIndex + 1}/${filteredList.length}`;
  }

  function startSentencePractice(ex) {
    const chars = Array.from(new Set((ex.zh.match(/[\u3400-\u9FFF]/g) || [])));
    if (!chars.length) {
      window.HSK.Toast && window.HSK.Toast.warning("Không có chữ Hán", "Câu này không có chữ Hán để luyện viết.");
      return;
    }
    if (!sentenceMode) sentenceBackup = { list: filteredList, index: currentIndex };
    sentenceMode = { zh: ex.zh, vi: ex.vi, pinyin: ex.pinyin };
    filteredList = chars.map(buildEntryForChar);
    currentUiMode = "animate";
    renderCharList();
    loadCharAt(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function exitSentencePractice() {
    if (!sentenceMode || !sentenceBackup) return;
    filteredList = sentenceBackup.list;
    currentIndex = Math.min(sentenceBackup.index, filteredList.length - 1);
    sentenceMode = null;
    sentenceBackup = null;
    renderCharList();
    loadCharAt(currentIndex);
  }

  function renderWriteExamples(c) {
    const listEl = $("#writeExampleList");
    if (!listEl || typeof window.HSK_getExampleSentences !== "function") return;
    // Uu tien lay ca tu (wordHanzi) de co ngu canh day du, fallback ve bang than chu don le
    const fullWord = window.HSK_getAllWords ? window.HSK_getAllWords().find(w => w.hanzi === c.wordHanzi) : null;
    const wordForExamples = fullWord || { hanzi: c.char, pinyin: c.pinyin, meaning_vi: c.meaning, word_type: "Danh từ", id: c.char };
    const examples = window.HSK_getExampleSentences(wordForExamples, 3);
    listEl.innerHTML = examples.map((ex, i) => `
      <div class="wd-example-box">
        <div class="wd-example-zh">
          ${escapeHtml(ex.zh)} <span class="wd-example-pinyin">(${escapeHtml(ex.pinyin)})</span>
          <button class="vc-icon-btn audio-btn write-example-audio" type="button" data-zh="${escapeHtml(ex.zh)}" aria-label="Phát âm câu ví dụ" title="Phát âm">🔊</button>
        </div>
        <div class="wd-example-vi">${escapeHtml(ex.vi)}</div>
        <div class="wd-example-actions">
          <button class="btn btn-soft btn-sm write-example-practice" type="button" data-idx="${i}">✍️ Luyện viết câu này</button>
        </div>
      </div>
    `).join("");
    listEl.querySelectorAll(".write-example-audio").forEach(btn => {
      btn.addEventListener("click", () => window.HSK_TTS && window.HSK_TTS.speak(btn.dataset.zh));
    });
    listEl.querySelectorAll(".write-example-practice").forEach(btn => {
      btn.addEventListener("click", () => startSentencePractice(examples[+btn.dataset.idx]));
    });
  }

  function loadCharAt(idx) {
    if (!filteredList.length) return;
    currentIndex = Math.max(0, Math.min(idx, filteredList.length - 1));
    const c = filteredList[currentIndex];
    $("#stageWord").textContent = c.char;
    $("#stagePinyin").textContent = c.pinyin;
    $("#stageMeaning").textContent = c.meaning + (c.wordHanzi.length > 1 ? " · trong từ " + c.wordHanzi : "");
    createWriterInstance(c.char);
    renderCharList();
    renderWriteExamples(c);
    updateSentenceBanner();
  }

  function applyFilterAndLoad(preferredChar) {
    const level = $("#writeLevelSelect").value;
    const q = $("#writeSearchInput").value.trim();
    const full = buildCharListForLevel(level);
    filteredList = q
      ? full.filter(c => c.char.includes(q) || c.pinyin.toLowerCase().includes(q.toLowerCase()) || c.meaning.toLowerCase().includes(q.toLowerCase()))
      : full;
    let startIdx = 0;
    if (preferredChar) {
      const found = filteredList.findIndex(c => c.char === preferredChar);
      if (found > -1) startIdx = found;
    }
    renderCharList();
    if (filteredList.length) loadCharAt(startIdx);
    else $("#writeCanvasWrap").innerHTML = `<p class="muted" style="padding:30px">Không có chữ nào phù hợp bộ lọc.</p>`;
  }

  /* Tinh nang: Dich cau tieng Viet sang tieng Trung, roi dua vao hang doi luyen viet theo cau. */
  function initTranslateWrite() {
    const btn = $("#translateBtn");
    if (!btn) return; // phong khi HTML chua co block nay
    const input = $("#viInput");
    const resultBox = $("#translateResult");
    const errorBox = $("#translateError");

    function showError(msg) {
      resultBox.classList.add("hidden");
      errorBox.textContent = msg;
      errorBox.classList.remove("hidden");
    }

    async function doTranslate() {
      const text = input.value.trim();
      errorBox.classList.add("hidden");
      if (!text) {
        showError("Vui lòng nhập một câu tiếng Việt trước đã nhé.");
        input.focus();
        return;
      }
      if (!window.HSK_Translate) {
        showError("⚠️ Không tải được module dịch. Vui lòng tải lại trang.");
        return;
      }
      btn.disabled = true;
      const originalLabel = btn.textContent;
      btn.textContent = "Đang dịch…";
      try {
        const zh = await window.HSK_Translate.translateViToZh(text);
        const pinyin = window.HSK_Translate.getPinyin(zh);
        $("#trZh").textContent = zh;
        $("#trPinyin").textContent = pinyin;
        $("#trViEcho").textContent = "\"" + text + "\"";
        resultBox.dataset.zh = zh;
        resultBox.dataset.pinyin = pinyin;
        resultBox.dataset.vi = text;
        errorBox.classList.add("hidden");
        resultBox.classList.remove("hidden");
      } catch (err) {
        showError("⚠️ Không dịch được câu này. Vui lòng kiểm tra kết nối mạng rồi thử lại.");
      } finally {
        btn.disabled = false;
        btn.textContent = originalLabel;
      }
    }

    btn.addEventListener("click", doTranslate);
    $("#trRetryBtn").addEventListener("click", doTranslate);
    input.addEventListener("keydown", e => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doTranslate(); }
    });
    $("#trAudioBtn").addEventListener("click", () => {
      const zh = resultBox.dataset.zh;
      if (zh && window.HSK_TTS) window.HSK_TTS.speak(zh);
    });
    $("#trPracticeBtn").addEventListener("click", () => {
      const zh = resultBox.dataset.zh;
      if (!zh) return;
      startSentencePractice({ zh, vi: resultBox.dataset.vi || "", pinyin: resultBox.dataset.pinyin || "" });
    });
  }

  function init() {
    populateLevelSelect();
    refreshStats();
    initTranslateWrite();

    const params = new URLSearchParams(window.location.search);
    const wantChar = params.get("char");
    const wantSentenceZh = params.get("sentence");
    if (wantChar) $("#writeLevelSelect").value = "all";

    $("#writeLevelSelect").addEventListener("change", () => { sentenceMode = null; sentenceBackup = null; applyFilterAndLoad(); });
    let t;
    $("#writeSearchInput").addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { sentenceMode = null; sentenceBackup = null; applyFilterAndLoad(); }, 200); });
    $("#exitSentenceBtn").addEventListener("click", exitSentencePractice);

    document.querySelectorAll(".write-mode-tabs .tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.dataset.writemode === "animate") startAnimateMode();
        else startQuizMode();
      });
    });
    $("#switchToQuizBtn").addEventListener("click", startQuizMode);
    $("#replayBtn").addEventListener("click", () => writer && writer.animateCharacter());
    $("#showOutlineBtn").addEventListener("click", () => {
      if (!writer) return;
      writer._outlineVisible = !writer._outlineVisible;
      if (writer._outlineVisible) writer.showOutline(); else writer.hideOutline();
    });
    $("#quizResetBtn").addEventListener("click", startQuizMode);
    $("#quizHintBtn").addEventListener("click", () => {
      if (!writer) return;
      writer.showOutline();
      setTimeout(() => { if (currentUiMode === "quiz") writer.hideOutline(); }, 1400);
    });
    $("#stageAudioBtn").addEventListener("click", () => {
      const c = filteredList[currentIndex];
      if (c) window.HSK_TTS.speak(c.char);
    });
    $("#prevCharBtn").addEventListener("click", () => loadCharAt(currentIndex - 1));
    $("#nextCharBtn").addEventListener("click", () => loadCharAt(currentIndex + 1));

    applyFilterAndLoad(wantChar);

    if (wantSentenceZh) {
      startSentencePractice({
        zh: wantSentenceZh,
        pinyin: params.get("sentencePinyin") || "",
        vi: params.get("sentenceVi") || ""
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
