/* profile.js — Logic trang Ho so ca nhan: XP bar, streak, tabs, doi muc HSK, nhat ky */
(function () {
  "use strict";
  const { requireAuth, HSK_LEVELS, Auth, Toast, Modal } = window.HSK;

  document.addEventListener("DOMContentLoaded", () => {
    const user = requireAuth();
    if (!user) return;

    document.getElementById("levelPill").textContent = "Lv " + user.level;
    const xpPct = Math.min(100, Math.round((user.xp / user.xpToNext) * 100));
    setTimeout(() => { document.getElementById("xpBar").style.width = xpPct + "%"; }, 100);
    document.getElementById("xpText").textContent = user.xp.toLocaleString("vi-VN") + " / " + user.xpToNext.toLocaleString("vi-VN") + " XP";
    document.getElementById("xpRemain").textContent = (user.xpToNext - user.xp).toLocaleString("vi-VN");
    document.getElementById("streakCount").textContent = user.streak;

    renderStreakRow(user.streak);
    renderHskSelect(user);
    renderMiniProgress(user);
    renderBadges(user);
    renderJournal();
    initTabs();

    document.getElementById("editProfileBtn").addEventListener("click", () => {
      Modal.open({
        title: "Chỉnh sửa hồ sơ",
        body: `
          <div class="field"><label>Họ và tên</label><div class="field-input"><input id="editName" value="${user.name}"></div></div>
          <div class="field"><label>Email</label><div class="field-input"><input id="editEmail" value="${user.email}" disabled style="opacity:.6"></div></div>`,
        actions: [
          { label: "Hủy", cls: "btn-ghost" },
          { label: "Lưu thay đổi", cls: "btn-primary", onClick: () => {
              const newName = document.getElementById("editName").value.trim();
              if (newName) {
                user.name = newName;
                user.avatarInitial = newName.charAt(0).toUpperCase();
                Auth.saveProfile(user);
                Toast.success("Đã cập nhật hồ sơ", "Tải lại trang để thấy thay đổi đầy đủ.");
                document.querySelectorAll("[data-user-name]").forEach(el => el.textContent = newName);
                document.querySelectorAll("[data-user-avatar]").forEach(el => el.textContent = user.avatarInitial);
              }
            } }
        ]
      });
    });
  });

  function renderStreakRow(streak) {
    const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const today = (new Date().getDay() + 6) % 7; // 0 = Thu2
    document.getElementById("streakRow").innerHTML = days.map((d, i) => {
      const active = i <= today && streak > 0;
      return `<div class="streak-day ${active ? "active" : ""}"><div class="sd-dot">${active ? "🔥" : ""}</div><div class="sd-name">${d}</div></div>`;
    }).join("");
  }

  function renderHskSelect(user) {
    const sel = document.getElementById("hskSelect");
    sel.innerHTML = HSK_LEVELS.map(lv => `<option value="${lv.id}" ${lv.id === user.currentHSK ? "selected" : ""}>${lv.name} (${user.progress[lv.id] || 0}% hoàn thành)</option>`).join("");
    sel.addEventListener("change", () => {
      user.currentHSK = sel.value;
      window.HSK.Auth.saveProfile(user);
      Toast.success("Đã cập nhật mức HSK", "Lộ trình học của bạn đã chuyển sang " + sel.options[sel.selectedIndex].text.split(" (")[0]);
    });
  }

  function renderMiniProgress(user) {
    document.getElementById("progressMini").innerHTML = HSK_LEVELS.map(lv => {
      const pct = user.progress[lv.id] || 0;
      return `<div class="progress-row"><span class="pr-label">${lv.name}</span><div class="progress-track"><i style="width:${pct}%"></i></div><span class="pr-pct">${pct}%</span></div>`;
    }).join("");
  }

  function renderBadges(user) {
    document.getElementById("badgeGridProfile").innerHTML = user.badges.map(b => `
      <div class="badge-item ${b.earned ? "" : "locked"}"><div class="badge-ico">${b.icon}</div><div class="badge-name">${b.name}</div></div>`).join("");
  }

  function renderJournal() {
    const entries = [
      { date: "29/06/2026 · 21:40", text: "Hoàn thành 25 phút luyện nghe HSK3, đạt 92% độ chính xác." },
      { date: "28/06/2026 · 20:15", text: "Ôn tập 40 từ vựng HSK2, 35 từ nhớ chính xác." },
      { date: "27/06/2026 · 19:30", text: "Học 18 từ vựng mới chủ đề 'Thời tiết & Du lịch'." },
      { date: "26/06/2026 · 21:00", text: "Làm đề thi thử HSK3 Mini Test #4 — đạt 81 điểm." },
      { date: "25/06/2026 · 18:50", text: "Luyện ngữ pháp: cấu trúc 把 (bǎ) và 被 (bèi)." }
    ];
    setTimeout(() => {
      document.getElementById("journalList").innerHTML = entries.map(e => `
        <div class="progress-row" style="align-items:flex-start">
          <span style="width:140px;flex-shrink:0;font-size:.78rem;color:var(--ink-faint);font-weight:700">${e.date}</span>
          <span style="font-size:.86rem">${e.text}</span>
        </div>`).join("");
      document.getElementById("journalSkeleton").classList.add("hidden");
      document.getElementById("journalList").classList.remove("hidden");
    }, 800);
  }

  function initTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
      });
    });
  }
})();
