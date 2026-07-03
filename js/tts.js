/* tts.js — Module phat am chu Han bang Web Speech API (mien phi, khong can file audio)
   Su dung: window.HSK_TTS.speak("你好") | .speak("你好", { rate: 0.8 }) | .stop() */
(function () {
  "use strict";

  const HSK_TTS = {
    supported: typeof window !== "undefined" && "speechSynthesis" in window,
    voice: null,
    rate: 0.9,

    init() {
      if (!this.supported) return;
      const pick = () => {
        const voices = window.speechSynthesis.getVoices();
        // Uu tien giong Trung Quoc dai luc, fallback giong Trung bat ky
        this.voice =
          voices.find(v => v.lang === "zh-CN") ||
          voices.find(v => v.lang && v.lang.toLowerCase().startsWith("zh")) ||
          null;
      };
      pick();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = pick;
      }
    },

    /* Doc 1 chuoi chu Han (hoac cau vi du). opts: { rate, onEnd } */
    speak(text, opts) {
      opts = opts || {};
      if (!this.supported) {
        window.HSK && window.HSK.Toast && window.HSK.Toast.warning(
          "Không hỗ trợ phát âm",
          "Trình duyệt của bạn không hỗ trợ Web Speech API."
        );
        return false;
      }
      window.speechSynthesis.cancel(); // huy cau truoc do tranh chong tieng
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "zh-CN";
      if (this.voice) utter.voice = this.voice;
      utter.rate = opts.rate || this.rate;
      utter.pitch = 1;
      if (opts.onEnd) utter.onend = opts.onEnd;
      window.speechSynthesis.speak(utter);
      return true;
    },

    /* Doc cham (luyen phat am / shadowing) */
    speakSlow(text, opts) {
      return this.speak(text, Object.assign({ rate: 0.55 }, opts || {}));
    },

    stop() {
      if (this.supported) window.speechSynthesis.cancel();
    },

    /* Doc tung tu trong 1 cau, co khoang nghi giua cac tu (dung cho "Doc tung tu") */
    speakWordByWord(words, opts) {
      opts = opts || {};
      if (!this.supported || !words || !words.length) return;
      window.speechSynthesis.cancel();
      let i = 0;
      const next = () => {
        if (i >= words.length) { opts.onEnd && opts.onEnd(); return; }
        const w = words[i++];
        this.speak(w, { rate: opts.rate || 0.7, onEnd: () => setTimeout(next, opts.gap || 350) });
      };
      next();
    }
  };

  window.HSK_TTS = HSK_TTS;
  document.addEventListener("DOMContentLoaded", () => HSK_TTS.init());
})();
