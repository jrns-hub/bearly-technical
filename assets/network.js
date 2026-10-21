// The valley network: every preview-site light joined to its nearest neighbors, with sparks traveling the links.
(async function () {
  const cv = document.getElementById("net"); if (!cv) return;
  const cx = cv.getContext("2d"), still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const P = await fetch("lights.json").then(r => r.json()).catch(() => []);
  if (!P.length) return;
  const la = P.map(p => p[0]), lo = P.map(p => p[1]);
  const A0 = Math.min(...la), A1 = Math.max(...la), O0 = Math.min(...lo), O1 = Math.max(...lo);
  let W, H, pts = [], edges = [];
  function size() {
    const d = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0);
    const pad = 40;
    pts = P.map(p => ({ x: pad + (p[1] - O0) / (O1 - O0) * (W - 2 * pad), y: H - pad - (p[0] - A0) / (A1 - A0) * (H - 2 * pad), k: p[3] }));
    edges = [];
    pts.forEach((a, i) => pts.map((b, j) => [j, (a.x - b.x) ** 2 + (a.y - b.y) ** 2]).filter(([j]) => j !== i).sort((u, v) => u[1] - v[1]).slice(0, 3)
      .forEach(([j]) => { if (i < j || !edges.some(e => e[0] === j && e[1] === i)) edges.push([i, j]); }));
  }
  const sparks = Array.from({ length: 26 }, () => ({ e: 0, k: Math.random() }));
  function frame(now) {
    const t = now / 1000; cx.clearRect(0, 0, W, H);
    cx.strokeStyle = "rgba(95,180,255,.32)"; cx.lineWidth = 1.2;
    edges.forEach(([i, j]) => { cx.beginPath(); cx.moveTo(pts[i].x, pts[i].y); cx.lineTo(pts[j].x, pts[j].y); cx.stroke(); });
    sparks.forEach(s => {
      if (!edges.length) return;
      s.k += still ? 0 : 0.012; if (s.k >= 1 || !s.e) { s.k = 0; s.e = edges[Math.floor(Math.random() * edges.length)]; }
      const [i, j] = s.e, x = pts[i].x + (pts[j].x - pts[i].x) * s.k, y = pts[i].y + (pts[j].y - pts[i].y) * s.k;
      cx.fillStyle = "rgba(255,213,107,.95)"; cx.beginPath(); cx.arc(x, y, 2.4, 0, 6.3); cx.fill();
    });
    pts.forEach((p, i) => {
      const tw = .7 + .3 * Math.sin(t * 2 + i);
      cx.fillStyle = `rgba(255,213,107,${.25 * tw})`; cx.beginPath(); cx.arc(p.x, p.y, 11, 0, 6.3); cx.fill();
      cx.fillStyle = p.k === "b" ? "#ffe39a" : "#fffaf0"; cx.beginPath(); cx.arc(p.x, p.y, 3.6, 0, 6.3); cx.fill();
    });
    if (!still) requestAnimationFrame(frame);
  }
  size(); addEventListener("resize", size); requestAnimationFrame(frame);
})();
