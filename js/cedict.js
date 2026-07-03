/* cedict.js — Module tra cứu từ điển Trung-Anh mở rộng, dùng dữ liệu CC-CEDICT
   (Creative Commons Attribution-Share Alike, cc-cedict.org) tải trực tiếp từ
   một bản mirror công khai trên GitHub qua CDN jsDelivr (chỉ cần internet).
   Không cần API key. Dữ liệu được tải MỘT LẦN mỗi phiên rồi giữ trong bộ nhớ. */
(function () {
  "use strict";

  const SOURCES = [
    "https://cdn.jsdelivr.net/gh/jtoy/crdict@master/cedict_ts.u8",
    "https://raw.githubusercontent.com/jtoy/crdict/master/cedict_ts.u8"
  ];

  const TONE_MARKS = {
    a: ["a", "ā", "á", "ǎ", "à"], e: ["e", "ē", "é", "ě", "è"],
    i: ["i", "ī", "í", "ǐ", "ì"], o: ["o", "ō", "ó", "ǒ", "ò"],
    u: ["u", "ū", "ú", "ǔ", "ù"], ü: ["ü", "ǖ", "ǘ", "ǚ", "ǜ"],
    A: ["A", "Ā", "Á", "Ǎ", "À"], E: ["E", "Ē", "É", "Ě", "È"],
    I: ["I", "Ī", "Í", "Ǐ", "Ì"], O: ["O", "Ō", "Ó", "Ǒ", "Ò"],
    U: ["U", "Ū", "Ú", "Ǔ", "Ù"]
  };

  function syllableToAccented(syll) {
    const m = syll.match(/^([a-zA-Züv]+)([0-5])$/i);
    if (!m) return syll;
    let base = m[1].replace(/v/g, "ü").replace(/V/g, "Ü");
    const tone = parseInt(m[2], 10);
    if (tone === 5 || tone === 0) return base;
    let idx = -1;
    if (base.indexOf("a") > -1) idx = base.indexOf("a");
    else if (base.indexOf("e") > -1) idx = base.indexOf("e");
    else if (base.indexOf("ou") > -1) idx = base.indexOf("o");
    else {
      for (let i = base.length - 1; i >= 0; i--) {
        if ("aeiouü".indexOf(base[i].toLowerCase()) > -1) { idx = i; break; }
      }
    }
    if (idx === -1) return base;
    const ch = base[idx];
    const table = TONE_MARKS[ch];
    if (!table) return base;
    return base.slice(0, idx) + table[tone] + base.slice(idx + 1);
  }

  function numericToAccented(pinyinStr) {
    if (!pinyinStr) return "";
    return pinyinStr.split(/\s+/).map(syllableToAccented).join(" ");
  }

  const LINE_RE = /^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/;

  function parseLine(line) {
    if (!line || line[0] === "#") return null;
    const m = LINE_RE.exec(line.trim());
    if (!m) return null;
    const [, trad, simp, pinyinRaw, defsRaw] = m;
    const defs = defsRaw.split("/").map(s => s.trim()).filter(Boolean);
    return {
      traditional: trad,
      simplified: simp,
      pinyinRaw,
      pinyin: numericToAccented(pinyinRaw),
      definitions: defs
    };
  }

  let entries = null;
  let byHanzi = null;
  let loadingPromise = null;

  function indexEntries() {
    byHanzi = new Map();
    entries.forEach(e => {
      [e.simplified, e.traditional].forEach(h => {
        if (!byHanzi.has(h)) byHanzi.set(h, []);
        const arr = byHanzi.get(h);
        if (arr.indexOf(e) === -1) arr.push(e);
      });
    });
  }

  async function fetchFromSources() {
    let lastErr = null;
    for (const url of SOURCES) {
      try {
        const res = await fetch(url, { mode: "cors" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const text = await res.text();
        if (!text || text.length < 1000) throw new Error("Du lieu rong/qua ngan");
        return text;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("Khong the tai du lieu tu bat ky nguon nao");
  }

  const HSK_CEDICT = {
    isLoaded() { return entries !== null; },

    load() {
      if (entries !== null) return Promise.resolve(entries);
      if (loadingPromise) return loadingPromise;
      loadingPromise = fetchFromSources()
        .then(text => {
          const lines = text.split("\n");
          const parsed = [];
          for (let i = 0; i < lines.length; i++) {
            const e = parseLine(lines[i]);
            if (e) parsed.push(e);
          }
          entries = parsed;
          indexEntries();
          return entries;
        })
        .catch(err => {
          loadingPromise = null;
          throw err;
        });
      return loadingPromise;
    },

    lookupExact(hanzi) {
      if (!byHanzi) return [];
      return byHanzi.get(hanzi) || [];
    },

    search(query, mode, limit) {
      mode = mode || "all";
      limit = limit || 60;
      if (!entries || !query) return [];
      const q = query.trim().toLowerCase();
      const qNoTone = q.replace(/[0-5]/g, "");
      const results = [];
      for (let i = 0; i < entries.length && results.length < limit * 6; i++) {
        const e = entries[i];
        let hit = false;
        if (mode === "all" || mode === "hanzi") {
          if (e.simplified === query || e.traditional === query) { results.unshift(e); continue; }
          if (e.simplified.indexOf(query) > -1 || e.traditional.indexOf(query) > -1) hit = true;
        }
        if (!hit && (mode === "all" || mode === "pinyin")) {
          const pyPlain = e.pinyinRaw.toLowerCase().replace(/[0-5]/g, "").replace(/\s+/g, "");
          if (pyPlain.indexOf(qNoTone.replace(/\s+/g, "")) > -1) hit = true;
        }
        if (!hit && (mode === "all" || mode === "meaning")) {
          for (let d = 0; d < e.definitions.length; d++) {
            if (e.definitions[d].toLowerCase().indexOf(q) > -1) { hit = true; break; }
          }
        }
        if (hit) results.push(e);
      }
      results.sort((a, b) => a.simplified.length - b.simplified.length);
      return results.slice(0, limit);
    },

    numericToAccented
  };

  /* ===== Dich Anh -> Viet cho cac nghia lay tu CC-CEDICT (vi CEDICT von chi co tieng Anh) =====
     Dung MyMemory Translation API (mien phi, khong can key). Co cache trong bo nho de
     khong dich lai nhieu lan cung 1 cau. */
  const viCache = new Map();

  HSK_CEDICT.translateToVi = async function (englishText) {
    if (!englishText) return "";
    const key = "en-vi:" + englishText.trim().toLowerCase();
    if (viCache.has(key)) return viCache.get(key);
    try {
      const url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(englishText) + "&langpair=en|vi";
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      let vi = data && data.responseData && data.responseData.translatedText;
      if (!vi || /INVALID|QUERY LENGTH/i.test(vi)) throw new Error("Ban dich khong hop le");
      vi = vi.trim();
      viCache.set(key, vi);
      return vi;
    } catch (err) {
      viCache.set(key, null);
      return null;
    }
  };

  /* Dich Viet -> Anh, dung khi nguoi dung go nghia tieng Viet de tra CC-CEDICT
     (vi CEDICT von la tu dien Trung-Anh, khong hieu tieng Viet truc tiep). */
  HSK_CEDICT.translateToEn = async function (vietnameseText) {
    if (!vietnameseText) return "";
    const key = "vi-en:" + vietnameseText.trim().toLowerCase();
    if (viCache.has(key)) return viCache.get(key);
    try {
      const url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(vietnameseText) + "&langpair=vi|en";
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      let en = data && data.responseData && data.responseData.translatedText;
      if (!en || /INVALID|QUERY LENGTH/i.test(en)) throw new Error("Ban dich khong hop le");
      en = en.trim();
      viCache.set(key, en);
      return en;
    } catch (err) {
      viCache.set(key, null);
      return null;
    }
  };

  window.HSK_CEDICT = HSK_CEDICT;
})();
