// The valley in wireframe: real elevation (AWS Terrarium tiles, z12) for Black Mountain and the Swannanoa Valley,
// drawn as glowing ridge lines, with one gold light per real business or nonprofit that has a preview site.
// A big bolt strikes downtown every few seconds and sends pulse rings across the valley.
(async function () {
  const cv = document.getElementById("terrain"); if (!cv) return;
  const cx = cv.getContext("2d"), tip = document.getElementById("tip");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [T, P] = await Promise.all([fetch("terrain.json").then(r => r.json()), fetch("lights.json").then(r => r.json()).catch(() => [])]);
  const [la0, lo0, la1, lo1] = T.bounds, GW = T.w, GH = T.h;
  const H0 = 600, H1 = Math.max(...T.m.flat());
  const raw = T.m.map(r => r.map(v => Math.max(0, (Math.max(v, H0) - H0) / (H1 - H0))));
  // soften the raw elevation once (3x3 average) so ridgelines read as smooth contours
  const h = raw.map((r, j) => r.map((_, i) => { let s = 0, n = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const v = raw[j + dj] && raw[j + dj][i + di]; if (v !== undefined) { s += v; n++; } } return s / n; }));
  const TOWN = [35.6177, -82.3206];
  const toGrid = (lat, lng) => [(lng - lo0) / (lo1 - lo0) * (GW - 1), (lat - la0) / (la1 - la0) * (GH - 1)];
  const hAt = (gx, gy) => { const x = Math.max(0, Math.min(GW - 1, Math.round(gx))), y = Math.max(0, Math.min(GH - 1, Math.round(gy))); return h[y][x]; };
  const lights = P.map(p => { const [gx, gy] = toGrid(p[0], p[1]); return { gx, gy, z: hAt(gx, gy), n: p[2], k: p[3], ph: Math.random() * 6.28 }; });
  const [tgx, tgy] = toGrid(TOWN[0], TOWN[1]); const town = { gx: tgx, gy: tgy, z: hAt(tgx, tgy) };

  let W, Hh, dpr, scale, ox, oy, yaw = -0.5, mouseX = 0;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; Hh = cv.clientHeight;
    cv.width = W * dpr; cv.height = Hh * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const wide = W > 1020;
    scale = (wide ? Math.min(W * 0.58, 860) : W * 1.05) / GW; ox = wide ? W * 0.64 : W * 0.5; oy = wide ? Hh * 0.62 : Hh * 0.74;
  }
  // grid -> screen: rotate around the valley center, tilt toward the viewer, lift by height
  function proj(gx, gy, z) {
    const x = gx - GW / 2, y = gy - GH / 2, c = Math.cos(yaw), s = Math.sin(yaw);
    const rx = x * c - y * s, ry = x * s + y * c;
    return [ox + rx * scale, oy + ry * scale * 0.48 - z * scale * 12];
  }
  const col = z => z > 0.7 ? `rgba(255,213,107,${0.5 + z * 0.5})` : z > 0.42 ? `rgba(140,205,255,${0.45 + z * 0.5})` : `rgba(95,168,255,${0.28 + z * 0.6})`;

  let strikes = [], last = -10, t0 = performance.now(), hover = -1;
  function bolt(tx, ty) {
    const main = [[tx + (Math.random() - .5) * 160, -20]]; let x = main[0][0], y = -20;
    while (y < ty - 16) { y += 22 + Math.random() * 30; x += (Math.random() - .5) * 56 + (tx - x) * .14; main.push([x, Math.min(y, ty)]); }
    main.push([tx, ty]);
    const branches = [];
    for (let i = 2; i < main.length - 2; i += 2) if (Math.random() < .55) {
      let [bx, by] = main[i]; const b = [[bx, by]], dir = Math.random() < .5 ? -1 : 1;
      for (let k = 0; k < 4; k++) { bx += dir * (14 + Math.random() * 30); by += 16 + Math.random() * 22; b.push([bx, by]); }
      branches.push(b);
    }
    return { main, branches };
  }
  function line(pts, w, a) { cx.lineWidth = w; cx.globalAlpha = a; cx.beginPath(); pts.forEach(([x, y], i) => i ? cx.lineTo(x, y) : cx.moveTo(x, y)); cx.stroke(); }

  function frame(now) {
    const t = (now - t0) / 1000;
    if (!still) yaw = -0.5 + Math.sin(t * 0.07) * 0.18 + mouseX * 0.12;
    cx.clearRect(0, 0, W, Hh);
    // ridge lines, back to front
    cx.lineJoin = "round";
    for (let j = 0; j < GH; j += 1) {
      let prev = null;
      for (let i = 0; i < GW; i++) {
        const z = h[j][i], p = proj(i, j, z);
        if (prev) { cx.strokeStyle = col((z + prev[2]) / 2); cx.lineWidth = 1 + z * 1.2; cx.beginPath(); cx.moveTo(prev[0], prev[1]); cx.lineTo(p[0], p[1]); cx.stroke(); }
        prev = [p[0], p[1], z];
      }
    }
    // a few cross-lines for the mesh feel
    cx.strokeStyle = "rgba(95,168,255,.13)"; cx.lineWidth = 1;
    for (let i = 0; i < GW; i += 6) { cx.beginPath(); for (let j = 0; j < GH; j++) { const p = proj(i, j, h[j][i]); j ? cx.lineTo(p[0], p[1]) : cx.moveTo(p[0], p[1]); } cx.stroke(); }

    // strike every ~7s
    const tp = proj(town.gx, town.gy, town.z);
    if (!still && t - last > 6) { last = t; strikes.push({ t, b: bolt(tp[0], tp[1]) }); }
    if (still && !strikes.length) strikes.push({ t: -1, b: bolt(tp[0], tp[1]) });
    strikes = strikes.filter(s => t - s.t < 3.2);
    for (const s of strikes) {
      const age = still ? 0.15 : t - s.t;
      if (age < 0.7) {
        const a = 1 - age / 0.7;
        cx.save(); cx.strokeStyle = "#fff6d2"; cx.shadowColor = "#f5b81c"; cx.shadowBlur = 40;
        line(s.b.main, 10, a * 0.35); line(s.b.main, 5, a); s.b.branches.forEach(b => line(b, 2.2, a * 0.8));
        cx.restore(); cx.globalAlpha = 1;
        if (!still) { cx.fillStyle = `rgba(255,236,170,${0.16 * a})`; cx.fillRect(0, 0, W, Hh); }
      }
      // pulse rings across the valley floor
      for (let r = 0; r < 3; r++) {
        const k = (age - r * 0.35) / 2.4; if (k <= 0 || k >= 1) continue;
        cx.strokeStyle = `rgba(255,213,107,${0.75 * (1 - k)})`; cx.lineWidth = 2;
        cx.beginPath(); cx.ellipse(tp[0], tp[1], k * scale * 60, k * scale * 60 * 0.48, 0, 0, 6.3); cx.stroke();
      }
    }
    // business lights
    lights.forEach((l, i) => {
      const [x, y] = proj(l.gx, l.gy, l.z), tw = 0.75 + 0.25 * Math.sin(t * 1.8 + l.ph), R = i === hover ? 7 : 3.4;
      const g = cx.createRadialGradient(x, y, 0, x, y, R * 6); g.addColorStop(0, `rgba(255,213,107,${0.6 * tw})`); g.addColorStop(1, "rgba(245,184,28,0)");
      cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, R * 6, 0, 6.3); cx.fill();
      cx.fillStyle = l.k === "b" ? "#ffe39a" : "#fffaf0"; cx.beginPath(); cx.arc(x, y, R, 0, 6.3); cx.fill();
      l.sx = x; l.sy = y;
    });
    // downtown marker
    cx.strokeStyle = "rgba(255,255,255,.9)"; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(tp[0], tp[1] - 16); cx.lineTo(tp[0], tp[1] - 54); cx.stroke();
    cx.fillStyle = "#fff"; cx.font = "600 12px 'JetBrains Mono', monospace"; cx.fillText("BLACK MOUNTAIN", tp[0] + 8, tp[1] - 46);
    if (!still) requestAnimationFrame(frame);
  }
  const host = cv.parentElement;
  host.addEventListener("pointermove", e => {
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    mouseX = (x / r.width - 0.5);
    let b = -1, bd = 220; lights.forEach((l, i) => { const d = (l.sx - x) ** 2 + (l.sy - y) ** 2; if (d < bd) { bd = d; b = i; } });
    hover = b;
    if (b >= 0) { tip.textContent = lights[b].n; tip.style.left = lights[b].sx + "px"; tip.style.top = lights[b].sy + "px"; tip.classList.add("on"); } else tip.classList.remove("on");
    if (still) frame(performance.now());
  });
  size(); addEventListener("resize", () => { size(); if (still) frame(performance.now()); });
  requestAnimationFrame(frame);
  // feed the ticker with the real names on the map
  const tk = document.getElementById("ticker");
  if (tk && P.length) tk.innerHTML = P.slice().sort(() => Math.random() - .5).map(p => `<i>&#9670;</i> ${p[2].toUpperCase().replace(/[<>&]/g, "")} · PREVIEW BUILT`).join("&nbsp;&nbsp;&nbsp;&nbsp;");
})();
