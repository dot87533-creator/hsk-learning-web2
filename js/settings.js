/* settings.js — Logic trang Cai dat: tabs, theme picker, doi mat khau, muc tieu, thong bao */
(function () {
  "use strict";
  const { requireAuth, Auth, Toast, Modal, ThemeManager } = window.HSK;

  document.addEventListener("DOMContentLoaded", () => {
    const user = requireAuth();
    if (!user) return;

    initTabs();
    initThemePicker();

    document.getElementById("nameInput").value = user.name;
    document.getElementById("emailInput").value = user.email;
    document.getElementById("goalDay").value = user.goals.day.target;
    document.getElementById("goalWeek").value = user.goals.week.target;
    document.getElementById("goalMonth").value = user.goals.month.target;

    document.getElementById("saveAccountBtn").addEventListener("click", () => {
      const newName = document.getElementById("nameInput").value.trim();
      if (!newName) { Toast.error("Lỗi", "Họ tên không được để trống."); return; }
      user.name = newName;
      user.avatarInitial = newName.charAt(0).toUpperCase();
      Auth.saveProfile(user);
      document.querySelectorAll("[data-user-name]").forEach(el => el.textContent = newName);
      document.querySelectorAll("[data-user-avatar]").forEach(el => el.textContent = user.avatarInitial);
      Toast.success("Đã lưu thông tin tài khoản");
    });

    document.getElementById("saveGoalsBtn").addEventListener("click", () => {
      user.goals.day.target = +document.getElementById("goalDay").value || user.goals.day.target;
      user.goals.week.target = +document.getElementById("goalWeek").value || user.goals.week.target;
      user.goals.month.target = +document.getElementById("goalMonth").value || user.goals.month.target;
      Auth.saveProfile(user);
      Toast.success("Đã cập nhật mục tiêu học tập", "Các thay đổi sẽ áp dụng từ hôm nay.");
    });

    document.getElementById("changePassForm").addEventListener("submit", e => {
      e.preventDefault();
      const cur = document.getElementById("currentPass").value;
      const p1 = document.getElementById("newPass1").value;
      const p2 = document.getElementById("newPass2").value;
      let valid = true;
      const setErr = (id, show) => document.getElementById(id).classList.toggle("has-error", show);
      setErr("f-current", !cur); if (!cur) valid = false;
      setErr("f-new1", p1.length < 8); if (p1.length < 8) valid = false;
      setErr("f-new2", p1 !== p2); if (p1 !== p2) valid = false;
      if (!valid) return;
      Toast.success("Đổi mật khẩu thành công", "Hãy dùng mật khẩu mới ở lần đăng nhập tới.");
      e.target.reset();
    });

    document.getElementById("deleteAccBtn").addEventListener("click", () => {
      Modal.confirm("Xoá tài khoản vĩnh viễn?", "Hành động này không thể hoàn tác. Toàn bộ XP, huy hiệu và tiến trình học sẽ bị mất.", () => {
        Toast.warning("Đây là bản demo", "Chức năng xoá tài khoản chỉ minh hoạ giao diện, dữ liệu của bạn được giữ nguyên.");
      });
    });

    // Cac switch thong bao: chi luu vao localStorage de demo tinh ben vung
    document.querySelectorAll(".switch input").forEach(sw => {
      const key = "hsk_notif_" + sw.id;
      const saved = window.HSK.Store.get(key);
      if (saved !== null) sw.checked = saved;
      sw.addEventListener("change", () => {
        window.HSK.Store.set(key, sw.checked);
        Toast.info("Đã lưu tuỳ chọn thông báo");
      });
    });
  });

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

  function initThemePicker() {
    const current = ThemeManager.current();
    document.querySelectorAll("[data-set-theme]").forEach(opt => {
      opt.classList.toggle("active", opt.dataset.setTheme === current);
      opt.addEventListener("click", () => {
        ThemeManager.apply(opt.dataset.setTheme);
        document.querySelectorAll("[data-set-theme]").forEach(o => o.classList.remove("active"));
        opt.classList.add("active");
        window.HSK.Toast.success("Đã đổi giao diện", opt.textContent.trim());
      });
    });
  }
})();
