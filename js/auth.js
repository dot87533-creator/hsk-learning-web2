/* auth.js — Xu ly form Dang nhap / Dang ky / Quen mat khau
   Dung chung Toast + Modal tu app.js, luu du lieu gia lap qua HSK.Auth (localStorage) */
(function () {
  "use strict";
  const { Toast, Auth } = window.HSK;

  /* Tien ich: hien/an loi tren field */
  function setError(fieldId, show) {
    const el = document.getElementById(fieldId);
    if (el) el.classList.toggle("has-error", show);
  }
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  /* Toggle hien mat khau */
  document.querySelectorAll("[data-toggle-pass]").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.togglePass);
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
    });
  });

  /* ---------------- LOGIN ---------------- */
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", e => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      let valid = true;
      setError("f-email", !isEmail(email)); if (!isEmail(email)) valid = false;
      setError("f-password", !password); if (!password) valid = false;
      if (!valid) return;

      const btn = document.getElementById("loginBtn");
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-sm"></span> Đang đăng nhập…';

      // Giả lập độ trễ mạng để minh hoạ trạng thái loading
      setTimeout(() => {
        try {
          Auth.login(email, password);
          Toast.success("Đăng nhập thành công", "Đang chuyển đến bảng điều khiển…");
          setTimeout(() => window.location.href = "dashboard.html", 700);
        } catch (err) {
          Toast.error("Đăng nhập thất bại", err.message);
          btn.disabled = false; btn.textContent = "Đăng nhập";
        }
      }, 900);
    });
  }

  /* ---------------- REGISTER ---------------- */
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    const pwInput = document.getElementById("password");
    pwInput.addEventListener("input", () => {
      const v = pwInput.value;
      const bar = document.getElementById("pwStrength");
      let score = 0;
      if (v.length >= 8) score++;
      if (/[A-Z]/.test(v) && /[0-9]/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v) && v.length >= 10) score++;
      bar.className = "pw-strength " + (score <= 1 ? "weak" : score === 2 ? "medium" : "strong");
    });

    registerForm.addEventListener("submit", e => {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const confirm = document.getElementById("confirm").value;
      const terms = document.getElementById("terms").checked;
      let valid = true;

      setError("f-name", !name); if (!name) valid = false;
      setError("f-email", !isEmail(email)); if (!isEmail(email)) valid = false;
      setError("f-password", password.length < 8); if (password.length < 8) valid = false;
      setError("f-confirm", confirm !== password || !confirm); if (confirm !== password || !confirm) valid = false;
      if (!terms) { Toast.warning("Cần đồng ý điều khoản", "Vui lòng đồng ý điều khoản sử dụng để tiếp tục."); valid = false; }
      if (!valid) return;

      const btn = document.getElementById("registerBtn");
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-sm"></span> Đang tạo tài khoản…';

      setTimeout(() => {
        try {
          const profile = Auth.register(name, email, password);
          profile.currentHSK = document.getElementById("level").value;
          Auth.saveProfile(profile);
          Toast.success("Tạo tài khoản thành công!", "Chào mừng " + name + " đến với HSK Master 🎉");
          setTimeout(() => window.location.href = "dashboard.html", 800);
        } catch (err) {
          Toast.error("Không thể đăng ký", err.message);
          btn.disabled = false; btn.textContent = "Tạo tài khoản";
        }
      }, 900);
    });
  }

  /* ---------------- FORGOT PASSWORD (2 buoc gia lap) ---------------- */
  const forgotForm = document.getElementById("forgotForm");
  if (forgotForm) {
    forgotForm.addEventListener("submit", e => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      if (!isEmail(email)) { setError("f-email", true); return; }
      setError("f-email", false);

      const btn = document.getElementById("sendBtn");
      btn.disabled = true; btn.innerHTML = '<span class="spinner-sm"></span> Đang gửi…';

      setTimeout(() => {
        Toast.success("Đã gửi email khôi phục", "Kiểm tra hộp thư của bạn (đây là bước minh hoạ).");
        document.getElementById("stepRequest").classList.add("hidden");
        document.getElementById("stepReset").classList.remove("hidden");
      }, 900);
    });
  }

  const resetForm = document.getElementById("resetForm");
  if (resetForm) {
    resetForm.addEventListener("submit", e => {
      e.preventDefault();
      const p1 = document.getElementById("newpass").value;
      const p2 = document.getElementById("newpass2").value;
      let valid = true;
      setError("f-new", p1.length < 8); if (p1.length < 8) valid = false;
      setError("f-new2", p1 !== p2); if (p1 !== p2) valid = false;
      if (!valid) return;
      Toast.success("Đặt lại mật khẩu thành công", "Bạn có thể đăng nhập bằng mật khẩu mới.");
      setTimeout(() => window.location.href = "login.html", 900);
    });
  }
})();
