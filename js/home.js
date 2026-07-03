/* home.js — Render danh sách cấp độ HSK & FAQ accordion trên trang chủ */
(function () {
  "use strict";

  const LEVEL_DETAILS = {
    hsk1: { desc: "Khởi đầu — giao tiếp cơ bản hàng ngày" },
    hsk2: { desc: "Mở rộng — chủ đề quen thuộc, đơn giản" },
    hsk3: { desc: "Trung cấp — giao tiếp đời sống, công việc nhẹ" },
    hsk4: { desc: "Trung cao — thảo luận chủ đề rộng" },
    hsk5: { desc: "Cao cấp — đọc báo, xem phim tiếng Trung" },
    hsk6: { desc: "Thông thạo — diễn đạt trôi chảy, học thuật" },
    hsk789: { desc: "Học thuật / chuyên sâu — Cao cấp 7-9" }
  };

  function renderLevels() {
    const grid = document.getElementById("levelGrid");
    if (!grid) return;
    const user = window.HSK.getCurrentUser();
    grid.innerHTML = window.HSK.HSK_LEVELS.map(lv => {
      const pct = user ? (user.progress[lv.id] || 0) : 0;
      return `
        <div class="card card-pad hoverable level-card" data-level="${lv.id}" tabindex="0" role="button" aria-label="Xem cấp độ ${lv.name}">
          <div class="lv-num">${lv.name.replace("HSK ", "")}</div>
          <div class="lv-name">${lv.name}</div>
          <div class="lv-meta">${LEVEL_DETAILS[lv.id].desc} · ${lv.words.toLocaleString("vi-VN")} từ</div>
          <div class="lv-bar"><i style="width:${pct}%"></i></div>
        </div>`;
    }).join("");

    grid.querySelectorAll(".level-card").forEach(card => {
      card.addEventListener("click", () => {
        const user2 = window.HSK.getCurrentUser();
        if (!user2) {
          window.HSK.Toast.warning("Cần đăng nhập", "Hãy đăng nhập để bắt đầu lộ trình " + card.querySelector(".lv-name").textContent);
          setTimeout(() => window.location.href = "login.html", 900);
        } else {
          window.location.href = "dashboard.html";
        }
      });
      card.addEventListener("keydown", e => { if (e.key === "Enter") card.click(); });
    });
  }

  const FAQS = [
    { q: "HSK Master phù hợp với người mới bắt đầu không?", a: "Có. Lộ trình bắt đầu từ HSK 1 với 150 từ vựng cơ bản, hướng dẫn từng bước cùng bài luyện nghe — nói đơn giản." },
    { q: "Tôi có thể học song song nhiều cấp độ không?", a: "Bạn có thể ôn lại cấp độ cũ trong lúc học cấp mới, hệ thống sẽ tự gợi ý từ cần ôn dựa trên dữ liệu quên lãng." },
    { q: "XP và Level dùng để làm gì?", a: "Mỗi hoạt động học (từ vựng, ngữ pháp, luyện nghe) đều cộng XP. Khi đủ XP bạn lên Level, mở khoá huy hiệu mới." },
    { q: "Tôi quên mật khẩu thì làm sao?", a: "Vào trang Đăng nhập, chọn 'Quên mật khẩu' và làm theo hướng dẫn đặt lại mật khẩu qua email." }
  ];

  function renderFaq() {
    const list = document.getElementById("faqList");
    if (!list) return;
    list.innerHTML = FAQS.map((f, i) => `
      <div class="card" style="margin-bottom:12px;overflow:hidden">
        <button class="faq-q" data-i="${i}" style="width:100%;text-align:left;padding:18px 20px;background:none;border:0;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:.94rem;color:var(--ink)">
          ${f.q}
          <span style="transition:transform .2s">＋</span>
        </button>
        <div class="faq-a" style="max-height:0;overflow:hidden;transition:max-height .3s ease;padding:0 20px;">
          <p style="padding-bottom:18px;margin:0">${f.a}</p>
        </div>
      </div>`).join("");

    list.querySelectorAll(".faq-q").forEach(btn => {
      btn.addEventListener("click", () => {
        const ans = btn.nextElementSibling;
        const icon = btn.querySelector("span");
        const isOpen = ans.style.maxHeight && ans.style.maxHeight !== "0px";
        list.querySelectorAll(".faq-a").forEach(a => a.style.maxHeight = "0px");
        list.querySelectorAll(".faq-q span").forEach(s => s.style.transform = "rotate(0deg)");
        if (!isOpen) { ans.style.maxHeight = ans.scrollHeight + "px"; icon.style.transform = "rotate(45deg)"; }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => { renderLevels(); renderFaq(); });
})();
