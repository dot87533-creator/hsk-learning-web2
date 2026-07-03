/* charts.js — Thu vien ve bieu do toi gian bang Canvas API thuan (khong dung thu vien ngoai)
   Cung cap 2 ham: drawBarChart, drawLineChart — dung chung cho Dashboard & Ho so. */
(function () {
  "use strict";

  function getCssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    return { ctx, w: rect.width, h: rect.height };
  }

  /* Bieu do cot don gian: labels[], values[] */
  function drawBarChart(canvas, labels, values, opts) {
    opts = opts || {};
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    const padBottom = 26, padTop = 14, padLeft = 6, padRight = 6;
    const chartH = h - padBottom - padTop;
    const max = Math.max(...values, 1) * 1.15;
    const barGap = 14;
    const barW = (w - padLeft - padRight - barGap * (values.length - 1)) / values.length;
    const ink = getCssVar("--ink-faint");
    const seal = opts.color || getCssVar("--seal");
    const gold = getCssVar("--gold");

    ctx.font = "11px Inter, sans-serif";
    ctx.fillStyle = ink;
    ctx.textAlign = "center";

    values.forEach((v, i) => {
      const barH = (v / max) * chartH;
      const x = padLeft + i * (barW + barGap);
      const y = padTop + chartH - barH;
      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, gold);
      grad.addColorStop(1, seal);
      ctx.fillStyle = grad;
      // bo goc tren cua cot
      const r = Math.min(6, barW / 2);
      ctx.beginPath();
      ctx.moveTo(x, y + barH);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.lineTo(x + barW - r, y);
      ctx.arcTo(x + barW, y, x + barW, y + r, r);
      ctx.lineTo(x + barW, y + barH);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = ink;
      ctx.fillText(labels[i], x + barW / 2, h - 8);
    });
  }

  /* Bieu do duong: labels[], values[] */
  function drawLineChart(canvas, labels, values, opts) {
    opts = opts || {};
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    const padBottom = 26, padTop = 18, padLeft = 10, padRight = 10;
    const chartH = h - padBottom - padTop;
    const chartW = w - padLeft - padRight;
    const max = Math.max(...values, 1) * 1.2;
    const min = 0;
    const seal = getCssVar("--seal");
    const ink = getCssVar("--ink-faint");
    const line = getCssVar("--line");

    const stepX = chartW / (values.length - 1);
    const points = values.map((v, i) => ({
      x: padLeft + i * stepX,
      y: padTop + chartH - ((v - min) / (max - min)) * chartH
    }));

    // luoi ngang
    ctx.strokeStyle = line; ctx.lineWidth = 1;
    for (let g = 0; g <= 3; g++) {
      const gy = padTop + (chartH / 3) * g;
      ctx.beginPath(); ctx.moveTo(padLeft, gy); ctx.lineTo(w - padRight, gy); ctx.stroke();
    }

    // vung to mau duoi duong (gradient fade)
    const grad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
    grad.addColorStop(0, "rgba(179,58,58,.25)");
    grad.addColorStop(1, "rgba(179,58,58,0)");
    ctx.beginPath();
    ctx.moveTo(points[0].x, padTop + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padTop + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // duong chinh
    ctx.beginPath();
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = seal; ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.stroke();

    // diem
    points.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = getCssVar("--paper-raised"); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = seal; ctx.stroke();
    });

    // nhan truc x
    ctx.font = "10px Inter, sans-serif";
    ctx.fillStyle = ink; ctx.textAlign = "center";
    labels.forEach((lab, i) => {
      if (labels.length > 10 && i % 2 !== 0) return; // tranh chong chu khi nhieu nhan
      ctx.fillText(lab, points[i].x, h - 8);
    });
  }

  window.HSKCharts = { drawBarChart, drawLineChart };
})();
