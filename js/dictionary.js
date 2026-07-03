/* dictionary.js — Trang Từ điển: tra cứu kết hợp kho HSK offline + CC-CEDICT online */
(function () {
  "use strict";

  const $ = sel => document.querySelector(sel);
  let mode = "all";
  let lastQuery = "";

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function setSourceNote(state, text) {
    const dot = $("#dictSourceDot");
    dot.className = "dot" + (state ? " " + state : "");
    $("#dictSourceText").textContent = text;
  }

  function fromHskWord(w) {
    return {
      source: "hsk",
      hanzi: w.hanzi,
      pinyin: w.pinyin,
      definitions: [w.meaning_vi + (w.meaning_en ? " (" + w.meaning_en + ")" : "")],
      example: w.example, exampleVi: w.example_vi,
      levelTag: w.level ? w.level.toUpperCase() : "",
      raw: w
    };
  }
  function fromCedictEntry(e) {
    return {
      source: "cedict",
      hanzi: e.simplified,
      pinyin: e.pinyin,
      definitions: e.definitions,
      example: "", exampleVi: "",
      levelTag: "CEDICT",
      raw: e
    };
  }

  function matchesLocal(w, q, m) {
    const ql = q.toLowerCase();
    if (m === "all" || m === "hanzi") if (w.hanzi.includes(q)) return true;
    if (m === "all" || m === "pinyin") if (w.pinyin.toLowerCase().replace(/[^a-zü]/g, "").includes(ql.replace(/[^a-zü]/g, ""))) return true;
    if (m === "all" || m === "meaning") if (w.meaning_vi.toLowerCase().includes(ql) || w.meaning_en.toLowerCase().includes(ql)) return true;
    return false;
  }

  function runLocalSearch(q, m) {
    if (typeof window.HSK_getAllWords !== "function") return [];
    return window.HSK_getAllWords().filter(w => matchesLocal(w, q, m)).slice(0, 40).map(fromHskWord);
  }

  function renderResults(list, query) {
    const grid = $("#dictResultsGrid");
    const empty = $("#dictEmpty");
    const meta = $("#dictResultsMeta");
    $("#dictLoading").classList.add("hidden");

    if (!list.length) {
      grid.innerHTML = "";
      meta.classList.add("hidden");
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");
    meta.classList.remove("hidden");
    $("#dictResultCount").textContent = list.length;
    $("#dictQueryEcho").textContent = query;

    grid.innerHTML = list.map((r, i) => `
      <div class="dict-result-card" data-idx="${i}">
        <div class="dr-hanzi">${escapeHtml(r.hanzi)}</div>
        <div class="dr-pinyin">${escapeHtml(r.pinyin)}</div>
        <div class="dr-def" data-def-slot="${i}">${escapeHtml(r.definitions.slice(0, 3).join("; "))}</div>
        <span class="dr-src">${r.source === "hsk" ? "Kho HSK · " + r.levelTag : "CC-CEDICT"}</span>
      </div>
    `).join("");

    grid.querySelectorAll(".dict-result-card").forEach(card => {
      card.addEventListener("click", () => openDetail(list[+card.dataset.idx]));
    });

    // Dich tu dong Anh -> Viet cho cac ket qua tu CC-CEDICT (chi co tieng Anh)
    list.forEach((r, i) => {
      if (r.source !== "cedict") return;
      const englishText = r.definitions.slice(0, 3).join("; ");
      window.HSK_CEDICT.translateToVi(englishText).then(vi => {
        if (!vi) return;
        const slot = grid.querySelector(`.dr-def[data-def-slot="${i}"]`);
        if (slot) slot.textContent = vi;
      });
    });
  }

  function openDetail(r) {
    $("#ddHanzi").textContent = r.hanzi;
    $("#ddPinyin").textContent = r.pinyin;
    $("#ddSrc").textContent = r.source === "hsk" ? "Kho từ vựng HSK · " + r.levelTag : "CC-CEDICT (mở rộng)";
    $("#ddDefList").innerHTML = r.definitions.map((d, i) =>
      `<li data-detail-def="${i}"><b>${i + 1}.</b><span data-def-en="${escapeHtml(d)}">${escapeHtml(d)}</span></li>`
    ).join("");

    // Neu la ket qua CC-CEDICT (chi co tieng Anh), dich tung nghia sang tieng Viet
    if (r.source === "cedict") {
      r.definitions.slice(0, 6).forEach((d, i) => {
        window.HSK_CEDICT.translateToVi(d).then(vi => {
          if (!vi) return;
          const li = $(`#ddDefList li[data-detail-def="${i}"] span`);
          if (li) li.textContent = vi + " (" + d + ")";
        });
      });
    }

    const exSection = $("#ddExampleSection");
    const examples = (r.source === "hsk" && r.raw && typeof window.HSK_getExampleSentences === "function")
      ? window.HSK_getExampleSentences(r.raw, 3)
      : (r.example ? [{ zh: r.example, pinyin: "", vi: r.exampleVi || "" }] : []);

    if (examples.length) {
      exSection.classList.remove("hidden");
      $("#ddExampleList").innerHTML = examples.map(ex => `
        <div class="wd-example-box">
          <div class="wd-example-zh">${escapeHtml(ex.zh)}${ex.pinyin ? ` <span class="wd-example-pinyin">(${escapeHtml(ex.pinyin)})</span>` : ""}</div>
          <div class="wd-example-vi">${escapeHtml(ex.vi)}</div>
          <div class="wd-example-actions">
            <a class="btn btn-soft btn-sm" href="writing.html?sentence=${encodeURIComponent(ex.zh)}&sentencePinyin=${encodeURIComponent(ex.pinyin || "")}&sentenceVi=${encodeURIComponent(ex.vi || "")}">✍️ Luyện viết câu này</a>
          </div>
        </div>
      `).join("");
    } else {
      exSection.classList.add("hidden");
    }

    $("#ddWriteBtn").href = "writing.html?char=" + encodeURIComponent(r.hanzi.charAt(0)) + "&word=" + encodeURIComponent(r.hanzi);
    $("#ddAudioBtn").onclick = () => window.HSK_TTS && window.HSK_TTS.speak(r.hanzi);

    $("#ddAddBtn").onclick = () => {
      if (r.source === "hsk" && r.raw && r.raw.id) {
        window.HSK_VocabState.toggleBookmark(r.raw.id);
        window.HSK.Toast.success("Đã lưu", "Từ đã được đánh dấu trong Kho từ vựng của bạn.");
      } else {
        window.HSK.Toast.info("Từ ngoài kho HSK", "Từ này đến từ CC-CEDICT nên chưa thể lưu vào kho HSK cá nhân — nhưng bạn có thể luyện viết hoặc phát âm ngay.");
      }
    };

    $("#dictDetailOverlay").classList.add("open");
  }

  function closeDetail() { $("#dictDetailOverlay").classList.remove("open"); }

  async function doSearch(query) {
    query = (query || "").trim();
    if (!query) return;
    lastQuery = query;

    const localResults = runLocalSearch(query, mode);
    if (localResults.length) renderResults(localResults, query);
    else {
      $("#dictResultsGrid").innerHTML = "";
      $("#dictResultsMeta").classList.add("hidden");
      $("#dictEmpty").classList.add("hidden");
    }

    if (!window.HSK_CEDICT.isLoaded()) {
      if (!localResults.length) {
        $("#dictLoading").classList.remove("hidden");
        $("#dictEmpty").classList.add("hidden");
      }
      setSourceNote("loading", "Đang tải cơ sở dữ liệu CC-CEDICT mở rộng (chỉ một lần)…");
      try {
        await window.HSK_CEDICT.load();
        setSourceNote("online", "Đã kết nối CC-CEDICT — kết quả được mở rộng từ hơn 120.000 mục từ.");
      } catch (err) {
        setSourceNote("", "Không thể tải CC-CEDICT (kiểm tra kết nối mạng) — chỉ hiển thị kết quả từ kho HSK có sẵn.");
        if (!localResults.length) renderResults([], query);
        return;
      }
    }

    if (lastQuery !== query) return;
    let cedictResults = window.HSK_CEDICT.search(query, mode, 48).map(fromCedictEntry);

    // Neu khong tim thay gi va dang tim theo nghia (hoac "tat ca"), thu dich cau tieng Viet
    // sang tieng Anh roi tra lai CC-CEDICT bang nghia tieng Anh do (vi CEDICT von la Trung-Anh)
    if (!cedictResults.length && (mode === "all" || mode === "meaning") && /[à-ỹ]/i.test(query)) {
      setSourceNote("loading", "Đang dịch câu tìm kiếm sang tiếng Anh để tra cứu mở rộng…");
      const enQuery = await window.HSK_CEDICT.translateToEn(query);
      if (lastQuery !== query) return;
      if (enQuery && enQuery.trim().toLowerCase() !== query.trim().toLowerCase()) {
        cedictResults = window.HSK_CEDICT.search(enQuery, "meaning", 48).map(fromCedictEntry);
      }
      setSourceNote("online", "Đã kết nối CC-CEDICT — kết quả được mở rộng từ hơn 120.000 mục từ.");
    }

    const localHanzi = new Set(localResults.map(r => r.hanzi));
    const merged = localResults.concat(cedictResults.filter(r => !localHanzi.has(r.hanzi)));
    renderResults(merged, query);
  }

  function init() {
    const input = $("#dictInput");
    const params = new URLSearchParams(window.location.search);
    const initialQ = params.get("q") || "";

    $("#dictSearchBtn").addEventListener("click", () => doSearch(input.value));
    input.addEventListener("keydown", e => { if (e.key === "Enter") doSearch(input.value); });

    document.querySelectorAll(".dict-search-modes .chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".dict-search-modes .chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        mode = chip.dataset.mode;
        if (input.value.trim()) doSearch(input.value);
      });
    });

    $("#ddCloseBtn").addEventListener("click", closeDetail);
    $("#dictDetailOverlay").addEventListener("click", e => { if (e.target.id === "dictDetailOverlay") closeDetail(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeDetail(); });

    if (initialQ) {
      input.value = initialQ;
      doSearch(initialQ);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
