// A wireframe globe that spins slowly, marking places lived and worked, with a route ending in Black Mountain. Drag to turn it.
(function () {
  const cv = document.getElementById("globe"); if (!cv) return;
  const cx = cv.getContext("2d"), still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const places = [["Hawaii", 19.7, -155.1], ["Nepal", 27.7, 85.3], ["Kazakhstan", 43.2, 76.9], ["Dubai", 25.2, 55.3], ["Porto", 41.15, -8.6],
    ["León, Spain", 42.6, -5.57], ["Paris", 48.86, 2.35], ["Bucharest", 44.43, 26.1], ["Yucatán", 20.7, -88.2], ["Florida", 29.9, -81.3],
    ["Texas", 29.4, -95.2], ["New Mexico", 35.1, -106.6], ["Tennessee", 35.96, -85.8], ["Black Mountain", 35.62, -82.32]];
  let W, H, R, rot = -60, tilt = 20, drag = null;
  function size() { const d = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0); R = Math.min(W, H) * 0.42; }
  function p3(lat, lng) {
    const la = lat * Math.PI / 180, lo = (lng + rot) * Math.PI / 180, t = tilt * Math.PI / 180;
    let x = Math.cos(la) * Math.sin(lo), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo);
    const y2 = y * Math.cos(t) - z * Math.sin(t), z2 = y * Math.sin(t) + z * Math.cos(t);
    return [W / 2 + x * R, H / 2 - y2 * R, z2];
  }
  function frame(now) {
    const t = now / 1000; if (!still && !drag) rot += 0.08;
    cx.clearRect(0, 0, W, H);
    const g = cx.createRadialGradient(W / 2 - R * .3, H / 2 - R * .3, R * .1, W / 2, H / 2, R); g.addColorStop(0, "#1f4796"); g.addColorStop(1, "#0b1a3f");
    cx.fillStyle = g; cx.beginPath(); cx.arc(W / 2, H / 2, R, 0, 6.3); cx.fill();
    cx.strokeStyle = "rgba(95,180,255,.5)"; cx.lineWidth = 1.2; cx.beginPath(); cx.arc(W / 2, H / 2, R, 0, 6.3); cx.stroke();
    // graticule, front half only
    cx.strokeStyle = "rgba(95,180,255,.22)"; cx.lineWidth = 1;
    for (let lat = -60; lat <= 60; lat += 30) { cx.beginPath(); let on = false; for (let lng = -180; lng <= 180; lng += 4) { const [x, y, z] = p3(lat, lng); if (z > 0) { on ? cx.lineTo(x, y) : cx.moveTo(x, y); on = true; } else on = false; } cx.stroke(); }
    for (let lng = -180; lng < 180; lng += 30) { cx.beginPath(); let on = false; for (let lat = -90; lat <= 90; lat += 4) { const [x, y, z] = p3(lat, lng); if (z > 0) { on ? cx.lineTo(x, y) : cx.moveTo(x, y); on = true; } else on = false; } cx.stroke(); }
    // route arcs between stops (great circle by slerp, drawn where visible)
    cx.strokeStyle = "rgba(255,213,107,.55)"; cx.lineWidth = 1.6;
    for (let i = 0; i < places.length - 1; i++) {
      const a = places[i], b = places[i + 1]; cx.beginPath(); let on = false;
      for (let k = 0; k <= 40; k++) { const f = k / 40, lat = a[1] + (b[1] - a[1]) * f, lng = a[2] + (b[2] - a[2]) * f, [x, y, z] = p3(lat, lng); const lift = 1 + Math.sin(f * Math.PI) * 0.08;
        const X = W / 2 + (x - W / 2) * lift, Y = H / 2 + (y - H / 2) * lift; if (z > -0.05) { on ? cx.lineTo(X, Y) : cx.moveTo(X, Y); on = true; } else on = false; }
      cx.stroke();
    }
    cx.font = "600 12px 'JetBrains Mono', monospace";
    places.forEach(([n, lat, lng], i) => {
      const [x, y, z] = p3(lat, lng); if (z <= 0) return;
      const home = n === "Black Mountain", pulse = home ? 6 + 3 * Math.sin(t * 3) : 4;
      cx.fillStyle = home ? "rgba(255,213,107,.3)" : "rgba(95,180,255,.25)"; cx.beginPath(); cx.arc(x, y, pulse * 2.4, 0, 6.3); cx.fill();
      cx.fillStyle = home ? "#ffd56b" : "#eaf3ff"; cx.beginPath(); cx.arc(x, y, home ? 5 : 3.6, 0, 6.3); cx.fill();
      if (z > 0.35) { cx.fillStyle = home ? "#ffd56b" : "#cfe2ff"; cx.fillText(n.toUpperCase(), x + 9, y + 4); }
    });
    if (!still || drag) requestAnimationFrame(frame);
  }
  cv.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, r: rot, t: tilt }; cv.setPointerCapture(e.pointerId); if (still) requestAnimationFrame(frame); });
  cv.addEventListener("pointermove", e => { if (!drag) return; rot = drag.r + (e.clientX - drag.x) * 0.4; tilt = Math.max(-60, Math.min(60, drag.t + (e.clientY - drag.y) * 0.3)); });
  cv.addEventListener("pointerup", () => { drag = null; if (!still) requestAnimationFrame(frame); });
  size(); addEventListener("resize", size); requestAnimationFrame(frame);
})();
