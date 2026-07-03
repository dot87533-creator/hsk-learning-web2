(function () {
  "use strict";

  const ThemeManager = {
    KEY: "hsk_theme",
    init() {
      const saved = localStorage.getItem(this.KEY) || "system";
      this.apply(saved);
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if ((localStorage.getItem(this.KEY) || "system") === "system") this.apply("system");
      });
    },
    apply(mode) {
      localStorage.setItem(this.KEY, mode);
      const isDark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
      document.querySelectorAll("[data-theme-active]").forEach(el => {
        el.classList.toggle("active", el.dataset.themeActive === mode);
      });
    },
    toggleQuick() {
      const current = document.documentElement.getAttribute("data-theme");
      this.apply(current === "dark" ? "light" : "dark");
    },
    current() { return localStorage.getItem(this.KEY) || "system"; }
  };

  const Toast = {
    host: null,
    icons: {
      success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
      error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
      warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.7 3.86a2 2 0 00-3.4 0z"/></svg>',
      info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
    },
    init() {
      this.host = document.createElement("div");
      this.host.className = "toast-host";
      this.host.setAttribute("aria-live", "polite");
      document.body.appendChild(this.host);
    },
    show(title, msg, type, duration) {
      msg = msg || ""; type = type || "info"; duration = duration === undefined ? 4200 : duration;
      if (!this.host) this.init();
      const el = document.createElement("div");
      el.className = "toast " + type;
      const colorVar = type === 'success' ? 'jade' : type === 'error' ? 'seal' : type === 'warning' ? 'gold' : 'seal';
      el.innerHTML =
        '<span class="toast-ico" style="color:var(--' + colorVar + ')">' + (this.icons[type] || this.icons.info) + '</span>' +
        '<div><div class="toast-title">' + title + '</div>' + (msg ? '<div class="toast-msg">' + msg + '</div>' : '') + '</div>' +
        '<button class="toast-close" aria-label="Đóng thông báo">&times;</button>';
      el.querySelector(".toast-close").onclick = () => this.remove(el);
      this.host.appendChild(el);
      if (duration) setTimeout(() => this.remove(el), duration);
      return el;
    },
    remove(el) {
      if (!el || !el.parentNode) return;
      el.classList.add("removing");
      setTimeout(() => el.remove(), 250);
    },
    success(t, m) { return this.show(t, m, "success"); },
    error(t, m) { return this.show(t, m, "error"); },
    warning(t, m) { return this.show(t, m, "warning"); },
    info(t, m) { return this.show(t, m, "info"); }
  };

  const Modal = {
    overlay: null,
    ensure() {
      if (this.overlay) return;
      this.overlay = document.createElement("div");
      this.overlay.className = "modal-overlay";
      this.overlay.innerHTML =
        '<div class="modal-box" role="dialog" aria-modal="true">' +
        '<div class="modal-head"><h3></h3><button class="modal-close" aria-label="Đóng">&times;</button></div>' +
        '<div class="modal-body"></div><div class="modal-foot"></div></div>';
      document.body.appendChild(this.overlay);
      this.overlay.addEventListener("click", e => { if (e.target === this.overlay) this.close(); });
      this.overlay.querySelector(".modal-close").onclick = () => this.close();
      document.addEventListener("keydown", e => { if (e.key === "Escape") this.close(); });
    },
    open(opts) {
      this.ensure();
      const actions = opts.actions || [];
      this.overlay.querySelector(".modal-head h3").textContent = opts.title || "";
      this.overlay.querySelector(".modal-body").innerHTML = opts.body || "";
      const foot = this.overlay.querySelector(".modal-foot");
      foot.innerHTML = "";
      actions.forEach(a => {
        const btn = document.createElement("button");
        btn.className = "btn " + (a.cls || "btn-ghost");
        btn.textContent = a.label;
        btn.onclick = () => { a.onClick && a.onClick(); if (a.close !== false) this.close(); };
        foot.appendChild(btn);
      });
      this.overlay.classList.add("open");
    },
    close() { if (this.overlay) this.overlay.classList.remove("open"); },
    confirm(title, body, onConfirm) {
      this.open({
        title, body,
        actions: [
          { label: "Hủy", cls: "btn-ghost" },
          { label: "Xác nhận", cls: "btn-primary", onClick: onConfirm }
        ]
      });
    }
  };

  const Store = {
    get(key, fallback) {
      fallback = fallback === undefined ? null : fallback;
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
    remove(key) { localStorage.removeItem(key); }
  };

  const HSK_LEVELS = [
    { id: "hsk1", name: "HSK 1", words: 150 },
    { id: "hsk2", name: "HSK 2", words: 300 },
    { id: "hsk3", name: "HSK 3", words: 600 },
    { id: "hsk4", name: "HSK 4", words: 1200 },
    { id: "hsk5", name: "HSK 5", words: 2500 },
    { id: "hsk6", name: "HSK 6", words: 5000 },
    { id: "hsk789", name: "HSK 7-9", words: 11000 }
  ];

  function seedUser(email, name) {
    return {
      email, name,
      avatarInitial: name.trim().charAt(0).toUpperCase(),
      level: 12, xp: 3260, xpToNext: 4000,
      currentHSK: "hsk3", streak: 18, joined: "2025-09-12",
      goals: { day: { target: 30, done: 22 }, week: { target: 180, done: 126 }, month: { target: 720, done: 410 } },
      progress: { hsk1: 100, hsk2: 88, hsk3: 54, hsk4: 21, hsk5: 6, hsk6: 0, hsk789: 0 },
      wordsLearned: 1342, wordsToReview: 86, avgScore: 87,
      strengths: ["Nghe hiểu", "Từ vựng", "Phát âm"],
      weaknesses: ["Ngữ pháp", "Viết chữ Hán"],
      badges: [
        { name: "7 ngày liên tiếp", icon: "🔥", earned: true },
        { name: "Hoàn thành HSK1", icon: "🎓", earned: true },
        { name: "1000 từ vựng", icon: "📚", earned: true },
        { name: "Cú đêm", icon: "🦉", earned: true },
        { name: "30 ngày liên tiếp", icon: "🏆", earned: false },
        { name: "Hoàn thành HSK3", icon: "🥋", earned: false },
        { name: "Điểm tuyệt đối", icon: "💯", earned: false },
        { name: "Học giả HSK6", icon: "👑", earned: false }
      ]
    };
  }

  function getCurrentUser() { return Store.get("hsk_current_user"); }

  function requireAuth() {
    const user = getCurrentUser();
    if (!user) { window.location.href = "login.html"; }
    return user;
  }

  const Auth = {
    register(name, email, password) {
      const users = Store.get("hsk_users", {});
      if (users[email]) throw new Error("Email này đã được đăng ký.");
      users[email] = { name, email, password };
      Store.set("hsk_users", users);
      const profile = seedUser(email, name);
      const allProfiles = Store.get("hsk_profiles", {});
      allProfiles[email] = profile;
      Store.set("hsk_profiles", allProfiles);
      Store.set("hsk_current_user", profile);
      return profile;
    },
    login(email, password) {
      const users = Store.get("hsk_users", {});
      if (email === "demo@hsk.vn" && password === "demo1234") {
        const profiles = Store.get("hsk_profiles", {});
        let profile = profiles[email];
        if (!profile) {
          profile = seedUser(email, "Học Viên Demo");
          profiles[email] = profile; Store.set("hsk_profiles", profiles);
          users[email] = { name: "Học Viên Demo", email, password };
          Store.set("hsk_users", users);
        }
        Store.set("hsk_current_user", profile);
        return profile;
      }
      const u = users[email];
      if (!u || u.password !== password) throw new Error("Email hoặc mật khẩu không đúng.");
      const profiles = Store.get("hsk_profiles", {});
      const profile = profiles[email];
      Store.set("hsk_current_user", profile);
      return profile;
    },
    logout() { Store.remove("hsk_current_user"); window.location.href = "index.html"; },
    saveProfile(profile) {
      Store.set("hsk_current_user", profile);
      const all = Store.get("hsk_profiles", {});
      all[profile.email] = profile;
      Store.set("hsk_profiles", all);
    }
  };

  function initNavbar() {
    const user = getCurrentUser();
    document.querySelectorAll("[data-auth-only]").forEach(el => el.classList.toggle("hidden", !user));
    document.querySelectorAll("[data-guest-only]").forEach(el => el.classList.toggle("hidden", !!user));

    if (user) {
      document.querySelectorAll("[data-user-name]").forEach(el => el.textContent = user.name);
      document.querySelectorAll("[data-user-email]").forEach(el => el.textContent = user.email);
      document.querySelectorAll("[data-user-avatar]").forEach(el => el.textContent = user.avatarInitial);
    }

    document.querySelectorAll("[data-theme-toggle]").forEach(btn => {
      btn.addEventListener("click", () => ThemeManager.toggleQuick());
    });

    document.querySelectorAll("[data-user-menu-trigger]").forEach(trigger => {
      const panel = trigger.parentElement.querySelector(".user-menu-panel");
      if (!panel) return;
      trigger.addEventListener("click", e => {
        e.stopPropagation();
        document.querySelectorAll(".user-menu-panel.open").forEach(p => { if (p !== panel) p.classList.remove("open"); });
        panel.classList.toggle("open");
      });
    });
    document.addEventListener("click", () => document.querySelectorAll(".user-menu-panel.open").forEach(p => p.classList.remove("open")));

    document.querySelectorAll("[data-logout]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.preventDefault();
        Modal.confirm("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất khỏi HSK Master?", () => {
          Toast.success("Đã đăng xuất", "Hẹn gặp lại bạn!");
          setTimeout(() => Auth.logout(), 600);
        });
      });
    });

    const burger = document.querySelector("[data-nav-burger]");
    const overlay = document.querySelector("[data-nav-overlay]");
    const sidebarEl = document.querySelector(".sidebar");
    const navLinksEl = document.querySelector(".nav-links");

    function closeMobileNav() {
      if (sidebarEl) sidebarEl.classList.remove("open");
      if (navLinksEl) navLinksEl.classList.remove("open");
      if (overlay) overlay.classList.remove("open");
      document.body.classList.remove("nav-locked");
    }
    function openMobileNav() {
      // Ưu tiên sidebar nếu trang có sidebar (dashboard, từ vựng…), ngược lại mở nav-links (trang công khai)
      if (sidebarEl) sidebarEl.classList.add("open");
      else if (navLinksEl) navLinksEl.classList.add("open");
      if (overlay) overlay.classList.add("open");
      document.body.classList.add("nav-locked");
    }
    if (burger) {
      burger.addEventListener("click", () => {
        const isOpen = (sidebarEl && sidebarEl.classList.contains("open")) ||
                        (navLinksEl && navLinksEl.classList.contains("open"));
        if (isOpen) closeMobileNav(); else openMobileNav();
      });
    }
    if (overlay) overlay.addEventListener("click", closeMobileNav);
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeMobileNav(); });
    // Tự đóng menu khi người dùng bấm vào 1 mục điều hướng (mobile)
    [sidebarEl, navLinksEl].forEach(el => {
      if (!el) return;
      el.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMobileNav));
    });

    QuickSearch.init();
  }

  /* ---------------- Tra từ điển nhanh (navbar) ----------------
     Tìm offline trong toàn bộ HSK_VOCAB (mọi trang có nạp vocabulary-data.js).
     Enter hoặc bấm "Xem tất cả" -> chuyển sang vocabulary.html?q=... */
  const QuickSearch = {
    init() {
      document.querySelectorAll("[data-search-input]").forEach(input => this.bind(input));
    },
    bind(input) {
      const wrap = input.closest(".search-box");
      if (!wrap) return;
      const dropdown = document.createElement("div");
      dropdown.className = "qs-dropdown";
      wrap.appendChild(dropdown);

      let t;
      input.addEventListener("input", () => {
        clearTimeout(t);
        t = setTimeout(() => this.renderResults(input.value.trim(), dropdown), 180);
      });
      input.addEventListener("focus", () => {
        if (input.value.trim()) this.renderResults(input.value.trim(), dropdown);
      });
      input.addEventListener("keydown", e => {
        if (e.key === "Enter" && input.value.trim()) {
          this.goToDictionary(input.value.trim());
        } else if (e.key === "Escape") {
          dropdown.classList.remove("open");
          input.blur();
        }
      });
      document.addEventListener("click", e => {
        if (!wrap.contains(e.target)) dropdown.classList.remove("open");
      });
    },
    goToDictionary(query, hanzi) {
      const q = encodeURIComponent(hanzi || query);
      window.location.href = "dictionary.html?q=" + q;
    },
    renderResults(query, dropdown) {
      if (!query) { dropdown.classList.remove("open"); return; }
      if (typeof window.HSK_getAllWords !== "function") { dropdown.classList.remove("open"); return; }

      const q = query.toLowerCase();
      const all = window.HSK_getAllWords();
      const matches = all.filter(w =>
        w.hanzi.toLowerCase().includes(q) ||
        w.pinyin.toLowerCase().includes(q) ||
        w.meaning_vi.toLowerCase().includes(q) ||
        w.meaning_en.toLowerCase().includes(q)
      ).slice(0, 7);

      if (!matches.length) {
        dropdown.innerHTML = `<div class="qs-empty">Không tìm thấy từ nào khớp với "${escapeHtml(query)}"</div>`;
        dropdown.classList.add("open");
        return;
      }

      dropdown.innerHTML = matches.map(w => `
        <button type="button" class="qs-item" data-hanzi="${escapeHtml(w.hanzi)}">
          <span class="qs-hanzi">${escapeHtml(w.hanzi)}</span>
          <span class="qs-info">
            <div class="qs-pinyin">${escapeHtml(w.pinyin)}</div>
            <div class="qs-meaning">${escapeHtml(w.meaning_vi)}</div>
          </span>
          <span class="qs-level">${w.level.toUpperCase()}</span>
        </button>
      `).join("") + `<button type="button" class="qs-viewall">🔎 Xem tất cả kết quả cho "${escapeHtml(query)}"</button>`;

      dropdown.querySelectorAll(".qs-item").forEach(el => {
        el.addEventListener("click", () => this.goToDictionary(query, el.dataset.hanzi));
      });
      dropdown.querySelector(".qs-viewall").addEventListener("click", () => this.goToDictionary(query));

      dropdown.classList.add("open");
    }
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------------- Cảnh báo trình duyệt trong ứng dụng (Zalo, Facebook, TikTok…) ----------------
     Các webview này thường chặn/giới hạn tải thư viện CDN (vd. hoạt ảnh nét chữ Hán), khiến
     một số tính năng bị trống/lỗi hiển thị. Gợi ý người dùng mở bằng trình duyệt thật. */
  const InAppBrowserNotice = {
    DISMISS_KEY: "hsk_inapp_notice_dismissed",
    detect() {
      const ua = navigator.userAgent || "";
      const patterns = [
        { name: "Zalo", re: /Zalo/i },
        { name: "Facebook", re: /FBAN|FBAV|FB_IAB/i },
        { name: "Messenger", re: /MessengerLite/i },
        { name: "Instagram", re: /Instagram/i },
        { name: "TikTok", re: /BytedanceWebview|TikTok/i },
        { name: "Line", re: /Line\// },
        { name: "WeChat", re: /MicroMessenger/i }
      ];
      const hit = patterns.find(p => p.re.test(ua));
      return hit ? hit.name : null;
    },
    init() {
      const appName = this.detect();
      if (!appName) return;
      if (sessionStorage.getItem(this.DISMISS_KEY) === "1") return;

      const bar = document.createElement("div");
      bar.setAttribute("role", "status");
      bar.style.cssText = "position:sticky;top:0;z-index:998;background:var(--seal);color:#fff;font-size:.82rem;font-weight:600;padding:10px 16px;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;text-align:center;";
      bar.innerHTML =
        `<span>⚠️ Bạn đang mở trong trình duyệt của ${escapeHtml(appName)} — một số tính năng (hoạt ảnh viết chữ, phát âm…) có thể không hiển thị đầy đủ.</span>
         <button type="button" style="background:#fff;color:var(--seal);border:0;border-radius:999px;padding:5px 14px;font-weight:700;font-size:.78rem;cursor:pointer;white-space:nowrap">Mở bằng trình duyệt ↗</button>
         <button type="button" aria-label="Đóng thông báo" style="background:transparent;border:0;color:#fff;font-size:1.1rem;cursor:pointer;padding:0 4px;line-height:1">&times;</button>`;
      const [openBtn, closeBtn] = bar.querySelectorAll("button");
      openBtn.addEventListener("click", () => {
        // Thử mở bằng trình duyệt hệ thống; nếu bị chặn, hướng dẫn copy link thủ công
        const url = window.location.href;
        const w = window.open(url, "_blank");
        if (!w) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).catch(() => {});
          }
          Toast.info("Không tự mở được", "Đã sao chép liên kết — hãy dán vào Safari/Chrome để mở nhé.");
        }
      });
      closeBtn.addEventListener("click", () => {
        sessionStorage.setItem(this.DISMISS_KEY, "1");
        bar.remove();
      });
      document.body.insertBefore(bar, document.body.firstChild);
    }
  };

  function initPageLoader() {
    const loader = document.querySelector(".page-loader");
    if (!loader) return;
    window.addEventListener("load", () => { setTimeout(() => loader.classList.add("hide"), 350); });
  }

  function revealAfterSkeleton(skeletonEl, realEl, delay) {
    delay = delay === undefined ? 900 : delay;
    realEl.classList.add("hidden");
    setTimeout(() => {
      skeletonEl.classList.add("hidden");
      realEl.classList.remove("hidden");
    }, delay);
  }

  window.HSK = {
    ThemeManager, Toast, Modal, Store, Auth,
    HSK_LEVELS, getCurrentUser, requireAuth,
    initNavbar, initPageLoader, revealAfterSkeleton
  };

  ThemeManager.init();

  document.addEventListener("DOMContentLoaded", () => {
    initNavbar();
    initPageLoader();
    Toast.init();
    InAppBrowserNotice.init();
  });
})();
