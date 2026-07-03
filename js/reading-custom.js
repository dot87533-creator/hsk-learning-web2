/* reading-custom.js — Luyện đọc tự do (offline-friendly)
   Luồng: Tiếng Việt → MyMemory dịch → Tiếng Trung
           → CC-CEDICT tách từ + Pinyin
           → Sinh bài tập offline từ kho HSK + CEDICT
   Không cần Anthropic API key, chạy được từ file:// */
(function () {
  "use strict";

  /* ====== STATE ====== */
  let currentResult = null;
  let isLoading = false;
  let inited = false;

  /* ====== UTILS ====== */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])
    );
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ====== BƯỚC 1: DỊCH VIỆT → TRUNG ====== */
  /* Câu dịch phải chứa ký tự Hán, nếu không coi như dịch thất bại
     (MyMemory hay trả nguyên văn câu gốc khi không tìm được bản dịch) */
  function hasHanzi(s) {
    return /[\u3400-\u9FFF]/.test(String(s || ""));
  }

  /* Nguồn 1: Google Translate (endpoint công khai, không cần API key) */
  async function translateViToZh_Google(text) {
    const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=zh-CN&dt=t&q="
      + encodeURIComponent(text);
    const res = await fetch(url);
    if (!res.ok) throw new Error("Google dịch lỗi (HTTP " + res.status + ")");
    const data = await res.json();
    const tr = Array.isArray(data) && Array.isArray(data[0])
      ? data[0].map(seg => seg[0]).join("")
      : "";
    if (!tr || !hasHanzi(tr)) throw new Error("Google không trả về bản dịch tiếng Trung hợp lệ");
    return tr.trim();
  }

  /* Nguồn 2 (dự phòng): MyMemory */
  async function translateViToZh_MyMemory(text) {
    const url = "https://api.mymemory.translated.net/get?q="
      + encodeURIComponent(text) + "&langpair=vi|zh-CN";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Lỗi kết nối dịch thuật (HTTP " + res.status + ")");
    const data = await res.json();
    const tr = data && data.responseData && data.responseData.translatedText;
    if (!tr || /INVALID|QUERY/i.test(tr) || !hasHanzi(tr)) {
      throw new Error("Dịch thuật thất bại, thử lại nhé!");
    }
    return tr.trim();
  }

  async function translateViToZh(text) {
    try {
      return await translateViToZh_Google(text);
    } catch (eGoogle) {
      try {
        return await translateViToZh_MyMemory(text);
      } catch (eMyMemory) {
        throw new Error("Không dịch được câu này sang tiếng Trung. Vui lòng kiểm tra kết nối mạng hoặc thử câu khác.");
      }
    }
  }

  /* ====== BƯỚC 2: TÁCH TỪ + PINYIN từ CEDICT ====== */
  /* Dùng maximum matching (longest first) trên chuỗi tiếng Trung */
  function segmentWithCedict(zhText) {
    if (!window.HSK_CEDICT || !window.HSK_CEDICT.isLoaded()) return null;

    const tokens = [];
    let i = 0;
    const clean = zhText.replace(/[。，！？、：；""''（）【】\s]/g, ch => {
      // giữ dấu câu như token riêng
      tokens.push({ zh: ch, pinyin: "", vi: "" });
      return "\x00";
    });

    // rebuild text không có dấu câu để segment
    const chars = zhText.split("");
    let pos = 0;
    const result = [];

    while (pos < chars.length) {
      const ch = chars[pos];
      // Dấu câu / khoảng trắng → token trực tiếp
      if (/[。，！？、：；""''（）【】\s]/.test(ch)) {
        result.push({ zh: ch, pinyin: "", vi: "" });
        pos++;
        continue;
      }

      let matched = false;
      // Thử khớp từ dài nhất trước (tối đa 6 chữ)
      for (let len = Math.min(6, chars.length - pos); len >= 1; len--) {
        const candidate = chars.slice(pos, pos + len).join("");
        const entries = window.HSK_CEDICT.lookupExact(candidate);
        if (entries && entries.length) {
          const e = entries[0];
          result.push({
            zh: candidate,
            pinyin: e.pinyin,
            vi: e.definitions.slice(0, 2).join("; ")
          });
          pos += len;
          matched = true;
          break;
        }
      }
      // Không khớp → giữ đơn ký tự
      if (!matched) {
        result.push({ zh: ch, pinyin: "", vi: "?" });
        pos++;
      }
    }
    return result;
  }

  /* Fallback: tách từng chữ Hán (khi CEDICT chưa load) */
  function segmentFallback(zhText) {
    return zhText.split("").map(ch => ({
      zh: ch,
      pinyin: "",
      vi: /[\u3400-\u9FFF]/.test(ch) ? "" : ""
    }));
  }

  /* Ghép Pinyin toàn câu từ tokens */
  function buildFullPinyin(tokens) {
    return tokens
      .filter(t => t.pinyin)
      .map(t => t.pinyin)
      .join(" ");
  }

  /* ====== BƯỚC 3: SINH BÀI TẬP OFFLINE ====== */

  /* Lấy đáp án nhiễu từ kho HSK (từ cùng loại hoặc ngẫu nhiên) */
  function getDistractors(correctVi, count) {
    count = count || 3;
    const all = typeof window.HSK_getAllWords === "function"
      ? window.HSK_getAllWords()
      : [];
    const pool = all
      .map(w => w.meaning_vi)
      .filter(m => m && m !== correctVi && m.length < 20);
    const chosen = [];
    const used = new Set([correctVi]);
    // shuffle để lấy ngẫu nhiên
    const shuffled = shuffle(pool);
    for (const m of shuffled) {
      if (!used.has(m)) { chosen.push(m); used.add(m); }
      if (chosen.length >= count) break;
    }
    // fallback nếu không đủ
    while (chosen.length < count) chosen.push("không xác định");
    return chosen;
  }

  /* Sinh 2 bài tập từ danh sách tokens */
  function generateExercises(tokens, zhFull) {
    // Lọc token có nghĩa
    const meaningful = tokens.filter(t =>
      /[\u3400-\u9FFF]/.test(t.zh) && t.vi && t.vi !== "?"
    );
    if (!meaningful.length) return [];

    const exercises = [];

    /* --- Bài 1: Trắc nghiệm "từ X nghĩa là gì?" --- */
    if (meaningful.length >= 1) {
      const target = meaningful[Math.floor(Math.random() * meaningful.length)];
      const distractors = getDistractors(target.vi, 3);
      const options = shuffle([target.vi, ...distractors]);
      const correct = options.indexOf(target.vi);
      exercises.push({
        type: "quiz",
        question: "Từ \"" + target.zh + "\" (" + target.pinyin + ") nghĩa là gì?",
        options,
        correct
      });
    }

    /* --- Bài 2: Điền chỗ trống --- */
    if (meaningful.length >= 2) {
      // Chọn ngẫu nhiên 1 từ để xoá khỏi câu
      const target = meaningful[Math.floor(Math.random() * meaningful.length)];
      const template = zhFull.replace(target.zh, "___");
      const distractors = [];

      // Lấy nhiễu từ CEDICT hoặc kho HSK
      if (window.HSK_CEDICT && window.HSK_CEDICT.isLoaded()) {
        const cedictResults = window.HSK_CEDICT.search(target.vi, "meaning", 10);
        cedictResults.forEach(e => {
          if (e.simplified !== target.zh) distractors.push(e.simplified);
        });
      }
      // fallback nhiễu từ kho HSK
      const hskAll = typeof window.HSK_getAllWords === "function"
        ? window.HSK_getAllWords() : [];
      hskAll
        .filter(w => w.hanzi !== target.zh && w.hanzi.length <= target.zh.length + 1)
        .slice(0, 10)
        .forEach(w => distractors.push(w.hanzi));

      const optWords = shuffle([target.zh, ...distractors]).slice(0, 4);
      if (!optWords.includes(target.zh)) optWords[0] = target.zh;
      const finalOpts = shuffle(optWords);

      exercises.push({
        type: "fill",
        template,
        answer: target.zh,
        hint: target.vi + (target.pinyin ? " · " + target.pinyin : ""),
        options: finalOpts
      });
    } else if (meaningful.length === 1 && exercises.length < 2) {
      /* Fallback bài 2: sắp xếp câu khi câu quá ngắn */
      const words = meaningful.map(t => t.zh);
      if (words.length >= 2) {
        exercises.push({
          type: "sort",
          words: shuffle(words),
          correct: words
        });
      }
    }

    return exercises.slice(0, 2);
  }

  /* ====== PIPELINE CHÍNH ====== */
  async function doTranslateAndGenerate(viText) {
    if (isLoading) return;
    isLoading = true;
    showLoading(true);

    try {
      /* B1: Dịch */
      setStatus("🌐 Đang dịch sang tiếng Trung…");
      const zhText = await translateViToZh(viText);

      /* B2: Load CEDICT nếu chưa có (1 lần duy nhất mỗi phiên) */
      let tokens;
      if (window.HSK_CEDICT) {
        if (!window.HSK_CEDICT.isLoaded()) {
          setStatus("📖 Đang tải từ điển để phân tích câu (chỉ một lần)…");
          try {
            await window.HSK_CEDICT.load();
          } catch (e) {
            // CEDICT không load được → dùng fallback
          }
        }
        tokens = window.HSK_CEDICT.isLoaded()
          ? segmentWithCedict(zhText)
          : segmentFallback(zhText);
      } else {
        tokens = segmentFallback(zhText);
      }

      /* B3: Sinh bài tập */
      setStatus("📝 Đang tạo bài tập…");
      const exercises = generateExercises(tokens, zhText);

      currentResult = {
        vi: viText,
        zh: zhText,
        pinyin: buildFullPinyin(tokens),
        tokens,
        exercises
      };

      renderResult(currentResult);

    } catch (err) {
      showError(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      isLoading = false;
      showLoading(false);
      setStatus("");
    }
  }

  /* ====== RENDER KẾT QUẢ ====== */
  function renderResult(r) {
    const area = document.getElementById("rcResultArea");
    if (!area) return;
    document.getElementById("rcInputArea").classList.add("hidden");
    area.classList.remove("hidden");

    document.getElementById("rcOriginalText").textContent = r.vi;

    /* Tokens */
    const tokenWrap = document.getElementById("rcTokens");
    tokenWrap.innerHTML = r.tokens
      .filter(t => t.zh.trim()) // bỏ token trắng
      .map((t, i) => {
        if (!/[\u3400-\u9FFF]/.test(t.zh)) {
          // Dấu câu → hiện nhỏ gọn
          return `<div class="rc-token rc-punct">${esc(t.zh)}</div>`;
        }
        return `
          <div class="rc-token" data-idx="${i}" title="${esc(t.vi)}">
            <div class="rc-tok-pinyin">${esc(t.pinyin || "")}</div>
            <div class="rc-tok-zh">${esc(t.zh)}</div>
            <div class="rc-tok-vi">${esc(t.vi || "")}</div>
          </div>`;
      }).join("");

    tokenWrap.querySelectorAll(".rc-token:not(.rc-punct)").forEach(el => {
      el.addEventListener("click", () => {
        tokenWrap.querySelectorAll(".rc-token").forEach(t => t.classList.remove("active"));
        el.classList.add("active");
        const idx = +el.dataset.idx;
        if (r.tokens[idx]) window.HSK_TTS?.speak(r.tokens[idx].zh);
      });
    });

    /* Câu đầy đủ */
    document.getElementById("rcFullZh").textContent = r.zh;
    document.getElementById("rcFullPinyin").textContent = r.pinyin || "(Pinyin sẽ hiển thị sau khi tải từ điển)";

    /* Bài tập */
    renderExercises(r.exercises, r);
  }

  /* ====== RENDER BÀI TẬP ====== */
  function renderExercises(exercises, r) {
    const wrap = document.getElementById("rcExercisesWrap");
    if (!wrap) return;

    if (!exercises || !exercises.length) {
      wrap.innerHTML = `<p class="muted" style="font-size:.87rem">⚡ Câu quá ngắn để tạo bài tập — hãy thử câu dài hơn nhé!</p>`;
      return;
    }

    wrap.innerHTML = "";
    exercises.forEach((ex, i) => {
      const el = document.createElement("div");
      el.className = "rc-exercise-block";
      el.dataset.idx = i;
      if (ex.type === "quiz")   el.innerHTML = renderQuiz(ex, i);
      else if (ex.type === "fill") el.innerHTML = renderFill(ex, i);
      else if (ex.type === "sort") el.innerHTML = renderSort(ex, i);
      wrap.appendChild(el);
      if (ex.type === "quiz")   bindQuiz(el, ex);
      else if (ex.type === "fill") bindFill(el, ex);
      else if (ex.type === "sort") bindSort(el, ex, i);
    });
  }

  /* --- Quiz --- */
  function renderQuiz(ex, i) {
    return `
      <div class="rc-ex-label">📝 Bài ${i+1} · Trắc nghiệm</div>
      <div class="rc-ex-question">${esc(ex.question)}</div>
      <div class="rc-ex-options">
        ${ex.options.map((o, oi) =>
          `<button class="read-quiz-opt" data-oi="${oi}">${esc(o)}</button>`
        ).join("")}
      </div>
      <div class="rc-ex-feedback hidden"></div>`;
  }
  function bindQuiz(block, ex) {
    block.querySelectorAll(".read-quiz-opt").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        const chosen = +btn.dataset.oi;
        block.querySelectorAll(".read-quiz-opt").forEach((b, bi) => {
          b.disabled = true; b.style.cursor = "default";
          if (bi === ex.correct) b.classList.add("correct");
          else if (bi === chosen) b.classList.add("incorrect");
        });
        const fb = block.querySelector(".rc-ex-feedback");
        fb.classList.remove("hidden");
        if (chosen === ex.correct) {
          fb.innerHTML = "✅ Chính xác!"; fb.className = "rc-ex-feedback ok";
        } else {
          fb.innerHTML = `❌ Chưa đúng — đáp án là: <b>${esc(ex.options[ex.correct])}</b>`;
          fb.className = "rc-ex-feedback err";
        }
      });
    });
  }

  /* --- Fill --- */
  function renderFill(ex, i) {
    return `
      <div class="rc-ex-label">✏️ Bài ${i+1} · Điền vào chỗ trống</div>
      <div class="rc-ex-question">${esc(ex.template)}</div>
      <div class="rc-ex-hint">💡 Gợi ý: ${esc(ex.hint)}</div>
      <div class="rc-fill-opts">
        ${ex.options.map((o, oi) =>
          `<button class="read-quiz-opt rc-fill-opt" data-val="${esc(o)}">${esc(o)}</button>`
        ).join("")}
      </div>
      <div class="rc-ex-feedback hidden"></div>`;
  }
  function bindFill(block, ex) {
    block.querySelectorAll(".rc-fill-opt").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        const chosen = btn.dataset.val;
        block.querySelectorAll(".rc-fill-opt").forEach(b => {
          b.disabled = true; b.style.cursor = "default";
          if (b.dataset.val === ex.answer) b.classList.add("correct");
          else if (b.dataset.val === chosen) b.classList.add("incorrect");
        });
        const fb = block.querySelector(".rc-ex-feedback");
        fb.classList.remove("hidden");
        if (chosen === ex.answer) {
          fb.innerHTML = `✅ Đúng! Câu đầy đủ: <b>${esc(ex.template.replace("___", ex.answer))}</b>`;
          fb.className = "rc-ex-feedback ok";
        } else {
          fb.innerHTML = `❌ Chưa đúng — đáp án là: <b>${esc(ex.answer)}</b>`;
          fb.className = "rc-ex-feedback err";
        }
      });
    });
  }

  /* --- Sort --- */
  function renderSort(ex, i) {
    const shuffled = shuffle(ex.words);
    return `
      <div class="rc-ex-label">🔀 Bài ${i+1} · Sắp xếp lại câu</div>
      <div class="rc-ex-question">Sắp xếp các từ thành câu hoàn chỉnh:</div>
      <div class="rc-sort-pool">
        ${shuffled.map((w, wi) =>
          `<button class="rc-sort-word" data-w="${esc(w)}" data-wi="${wi}">${esc(w)}</button>`
        ).join("")}
      </div>
      <div class="rc-sort-answer-label" style="font-size:.78rem;color:var(--ink-faint);margin:8px 0 4px;font-weight:700">Câu của bạn:</div>
      <div class="rc-sort-slots"></div>
      <div class="rc-sort-actions">
        <button class="btn btn-primary btn-sm rc-sort-check">Kiểm tra</button>
        <button class="btn btn-ghost btn-sm rc-sort-reset">↺ Làm lại</button>
      </div>
      <div class="rc-ex-feedback hidden"></div>`;
  }
  function bindSort(block, ex, idx) {
    const pool = block.querySelector(".rc-sort-pool");
    const slots = block.querySelector(".rc-sort-slots");
    let chosen = []; // [{w, wi}]

    function refreshUI() {
      const usedKeys = new Set(chosen.map(c => c.wi));
      pool.querySelectorAll(".rc-sort-word").forEach(btn => {
        btn.classList.toggle("used", usedKeys.has(+btn.dataset.wi));
      });
      slots.innerHTML = chosen.map((c, ci) =>
        `<button class="rc-sort-slot" data-ci="${ci}">${esc(c.w)}</button>`
      ).join("");
      slots.querySelectorAll(".rc-sort-slot").forEach(sl => {
        sl.addEventListener("click", () => {
          chosen.splice(+sl.dataset.ci, 1);
          refreshUI();
        });
      });
    }

    pool.querySelectorAll(".rc-sort-word").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("used")) return;
        chosen.push({ w: btn.dataset.w, wi: +btn.dataset.wi });
        refreshUI();
      });
    });

    block.querySelector(".rc-sort-check").addEventListener("click", () => {
      const userOrder = chosen.map(c => c.w);
      const isOk = JSON.stringify(userOrder) === JSON.stringify(ex.correct);
      const fb = block.querySelector(".rc-ex-feedback");
      fb.classList.remove("hidden");
      fb.innerHTML = isOk
        ? "✅ Hoàn toàn chính xác!"
        : `❌ Chưa đúng — thứ tự đúng: <b>${esc(ex.correct.join(" "))}</b>`;
      fb.className = "rc-ex-feedback " + (isOk ? "ok" : "err");
    });

    block.querySelector(".rc-sort-reset").addEventListener("click", () => {
      chosen = [];
      refreshUI();
      const fb = block.querySelector(".rc-ex-feedback");
      fb.classList.add("hidden");
    });
  }

  /* ====== TRẠNG THÁI UI ====== */
  function showLoading(on) {
    const btn = document.getElementById("rcTranslateBtn");
    if (!btn) return;
    btn.disabled = on;
    btn.innerHTML = on
      ? '<span class="spinner-sm"></span> Đang xử lý…'
      : "✨ Dịch &amp; Luyện tập";
  }

  function setStatus(msg) {
    const el = document.getElementById("rcStatusMsg");
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("hidden", !msg);
  }

  function showError(msg) {
    const err = document.getElementById("rcErrorArea");
    if (!err) return;
    err.classList.remove("hidden");
    document.getElementById("rcErrorMsg").textContent = msg;
  }

  function resetView() {
    currentResult = null;
    document.getElementById("rcResultArea")?.classList.add("hidden");
    document.getElementById("rcInputArea")?.classList.remove("hidden");
    document.getElementById("rcErrorArea")?.classList.add("hidden");
    showLoading(false);
    setStatus("");
  }

  /* ====== KHỞI TẠO ====== */
  function initCustomTab() {
    if (inited) return;
    inited = true;

    const wrap = document.getElementById("readCustomView");
    if (!wrap) return;

    /* Gợi ý mẫu */
    wrap.querySelectorAll(".rc-example-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const inp = document.getElementById("rcInput");
        if (inp) { inp.value = btn.dataset.text; inp.dispatchEvent(new Event("input")); }
      });
    });

    /* Đếm ký tự */
    const input = document.getElementById("rcInput");
    const counter = document.getElementById("rcCharCount");
    if (input && counter) {
      input.addEventListener("input", () => { counter.textContent = input.value.length + "/300"; });
    }

    /* Nút dịch */
    document.getElementById("rcTranslateBtn")?.addEventListener("click", () => {
      const text = (document.getElementById("rcInput")?.value || "").trim();
      if (!text) { window.HSK.Toast.warning("Chưa nhập nội dung", "Hãy nhập một câu tiếng Việt."); return; }
      if (text.length > 300) { window.HSK.Toast.warning("Câu quá dài", "Tối đa 300 ký tự."); return; }
      document.getElementById("rcErrorArea")?.classList.add("hidden");
      doTranslateAndGenerate(text);
    });

    /* Ctrl+Enter */
    if (input) {
      input.addEventListener("keydown", e => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          document.getElementById("rcTranslateBtn")?.click();
        }
      });
    }

    /* Phát âm */
    document.getElementById("rcPlayBtn")?.addEventListener("click", () => {
      if (currentResult) window.HSK_TTS?.speak(currentResult.zh);
    });
    document.getElementById("rcPlaySlowBtn")?.addEventListener("click", () => {
      if (currentResult) window.HSK_TTS?.speakSlow(currentResult.zh);
    });

    /* Nhập câu khác */
    document.getElementById("rcRetryBtn")?.addEventListener("click", resetView);
  }

  window.HSK_ReadingCustom = { init: initCustomTab };
})();
