/* dashboard.js — Render toan bo du lieu Dashboard: stat cards, tien do, muc tieu,
   bieu do, heatmap, huy hieu, lich su hoc. Yeu cau dang nhap (requireAuth). */
(function () {
  "use strict";
  const { requireAuth, HSK_LEVELS, Toast, Modal } = window.HSK;

  document.addEventListener("DOMContentLoaded", () => {
    const user = requireAuth();
    if (!user) return; // se redirect sang login.html

    renderStats(user);
    renderProgressList(user);
    renderGoalRings(user);
    renderSkillTags(user);
    renderBadges(user);
    renderHistory();
    renderHeatmap();

    // Ve bieu do sau khi DOM on dinh kich thuoc (tranh canvas 0px)
    setTimeout(() => {
      window.HSKCharts.drawLineChart(
        document.getElementById("progressChart"),
        ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"],
        [80, 95, 70, 110, 130, 100, 150, 175]
      );
      window.HSKCharts.drawBarChart(
        document.getElementById("timeChart"),
        ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
        [25, 40, 18, 35, 50, 65, 30]
      );
    }, 60);

    // Notification dropdown toggle
    const notifBtn = document.getElementById("notifBtn");
    const notifPanel = document.getElementById("notifPanel");
    if (notifBtn && notifPanel) {
      notifBtn.addEventListener("click", e => {
        e.stopPropagation();
        notifPanel.classList.toggle("open");
      });
    }

    // Nut ghi nhat ky hoc -> mo modal
    document.getElementById("logStudyBtn")?.addEventListener("click", () => {
      Modal.open({
        title: "Ghi nhật ký học tập",
        body: `
          <div class="field"><label>Hoạt động</label><div class="field-input"><select id="logActivity">
            <option>Học từ vựng mới</option><option>Ôn tập từ vựng</option><option>Luyện nghe</option><option>Luyện ngữ pháp</option><option>Làm đề thi thử</option>
          </select></div></div>
          <div class="field"><label>Thời lượng (phút)</label><div class="field-input"><input type="number" id="logMinutes" value="20" min="1"></div></div>`,
        actions: [
          { label: "Hủy", cls: "btn-ghost" },
          { label: "Lưu nhật ký", cls: "btn-primary", onClick: () => {
              Toast.success("Đã lưu nhật ký học!", "+15 XP cho phiên học vừa rồi.");
            } }
        ]
      });
    });

    window.HSK.revealAfterSkeleton(document.getElementById("statSkeleton"), document.getElementById("statGrid"), 700);
  });

  function renderStats(user) {
    const grid = document.getElementById("statGrid");
    const cards = [
      { label: "Từ đã học", value: user.wordsLearned.toLocaleString("vi-VN"), delta: "+48 tuần này", up: true,
        icon: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>' },
      { label: "Từ cần ôn", value: user.wordsToReview, delta: "Ưu tiên hôm nay", up: false,
        icon: '<path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/>' },
      { label: "Điểm trung bình", value: user.avgScore + "%", delta: "+3% so với tháng trước", up: true,
        icon: '<path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/>' },
      { label: "Chuỗi học", value: user.streak + " ngày", delta: "Kỷ lục: 31 ngày", up: true,
        icon: '<path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a6 6 0 11-12 0c0-1 .25-2.5 1.5-4.5z"/>' }
    ];
    grid.innerHTML = cards.map(c => `
      <div class="card card-pad stat-card hoverable">
        <div class="stat-top">
          <span class="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${c.icon}</svg></span>
          <span class="stat-delta ${c.up ? "up" : "down"}">${c.up ? "▲" : "•"} ${c.delta}</span>
        </div>
        <div class="stat-value">${c.value}</div>
        <div class="stat-label">${c.label}</div>
      </div>`).join("");
  }

  function renderProgressList(user) {
    const list = document.getElementById("progressList");
    list.innerHTML = HSK_LEVELS.map(lv => {
      const pct = user.progress[lv.id] || 0;
      return `<div class="progress-row">
        <span class="pr-label">${lv.name}</span>
        <div class="progress-track"><i style="width:${pct}%"></i></div>
        <span class="pr-pct">${pct}%</span>
      </div>`;
    }).join("");
  }

  function setRing(circleEl, labelEl, pct, text) {
    const r = circleEl.r.baseVal.value;
    const c = 2 * Math.PI * r;
    circleEl.style.strokeDasharray = c;
    circleEl.style.strokeDashoffset = c - (Math.min(pct, 100) / 100) * c;
    labelEl.textContent = text;
  }

  function renderGoalRings(user) {
    const d = user.goals.day, w = user.goals.week, m = user.goals.month;
    setRing(document.getElementById("ringDay"), document.getElementById("ringDayLabel"), (d.done / d.target) * 100, d.done + "/" + d.target + "′");
    setRing(document.getElementById("ringWeek"), document.getElementById("ringWeekLabel"), (w.done / w.target) * 100, Math.round((w.done / w.target) * 100) + "%");
    setRing(document.getElementById("ringMonth"), document.getElementById("ringMonthLabel"), (m.done / m.target) * 100, Math.round((m.done / m.target) * 100) + "%");
    document.getElementById("avgScoreText").textContent = user.avgScore + "%";
  }

  function renderSkillTags(user) {
    document.getElementById("strengthTags").innerHTML = user.strengths.map(s => `<span class="tag good">✓ ${s}</span>`).join("");
    document.getElementById("weaknessTags").innerHTML = user.weaknesses.map(s => `<span class="tag weak">! ${s}</span>`).join("");
  }

  function renderBadges(user) {
    document.getElementById("badgeGrid").innerHTML = user.badges.map(b => `
      <div class="badge-item ${b.earned ? "" : "locked"}">
        <div class="badge-ico">${b.icon}</div>
        <div class="badge-name">${b.name}</div>
      </div>`).join("");
  }

  function renderHistory() {
    const rows = [
      { date: "29/06/2026", act: "Luyện nghe HSK3", lv: "HSK 3", dur: "25 phút", score: "92%", xp: "+40" },
      { date: "28/06/2026", act: "Ôn tập từ vựng", lv: "HSK 2", dur: "15 phút", score: "88%", xp: "+25" },
      { date: "27/06/2026", act: "Học từ vựng mới", lv: "HSK 3", dur: "30 phút", score: "—", xp: "+50" },
      { date: "26/06/2026", act: "Làm đề thi thử", lv: "HSK 3", dur: "45 phút", score: "81%", xp: "+70" },
      { date: "25/06/2026", act: "Luyện ngữ pháp", lv: "HSK 2", dur: "20 phút", score: "95%", xp: "+35" }
    ];
    document.getElementById("historyBody").innerHTML = rows.map(r => `
      <tr><td>${r.date}</td><td>${r.act}</td><td>${r.lv}</td><td>${r.dur}</td><td>${r.score}</td><td style="color:var(--jade);font-weight:700">${r.xp}</td></tr>
    `).join("");
  }

  function renderHeatmap() {
    const map = document.getElementById("heatmap");
    let html = "";
    for (let i = 0; i < 182; i++) {
      const level = Math.floor(Math.random() * 5);
      html += `<i class="heat-${level}" title="Mức hoạt động: ${level}/4"></i>`;
    }
    map.innerHTML = html;
  }
})();
