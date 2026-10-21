// Shared header, footer, menu, scroll reveals and count-ups for every page.
(function(){
  const here = document.body.dataset.page || "home";
  const links = [["index.html","Home","home"],["launchpad.html","Launchpad","launchpad"],["services.html","Services","services"],
                 ["nonprofits.html","Nonprofits","nonprofits"],["community.html","Community","community"],["story.html","Story","story"]];
  const head = document.createElement("header");
  head.className = "bar";
  head.innerHTML = `<div class="wrap"><a class="brand" href="index.html"><img src="img/badge-180.png" alt="" width="48" height="48">Bearly Technical</a>
    <button class="menu-btn" aria-expanded="false" aria-controls="nav">Menu</button>
    <nav class="nav" id="nav" aria-label="Pages">${links.map(([h,t,k])=>`<a href="${h}"${k===here?' aria-current="page"':""}>${t}</a>`).join("")}
    <a class="btn btn-gold" href="book.html"${here==="book"?' aria-current="page"':""}>Book a free look</a></nav></div>`;
  document.body.prepend(head);
  const mb = head.querySelector(".menu-btn"), nav = head.querySelector(".nav");
  mb.addEventListener("click", () => { const o = nav.classList.toggle("open"); mb.setAttribute("aria-expanded", o); mb.textContent = o ? "Close" : "Menu"; });

  const foot = document.createElement("footer");
  foot.innerHTML = `<div class="wrap"><div><a class="brand" href="index.html"><img src="img/badge-180.png" alt="" width="48" height="48">Bearly Technical</a>
    <p>A launchpad for small businesses, nonprofits and churches in Black Mountain, the Swannanoa Valley and the Blue Ridge.</p></div>
    <div>${links.map(([h,t])=>`<a href="${h}">${t}</a>`).join("")}</div>
    <div><a href="book.html">Book a free look</a><a href="tel:+18659781063">Call 865-978-1063</a><a href="sms:+18659781063">Text 865-978-1063</a>
    <a href="https://jrns-hub.github.io/previews/">All preview sites</a><a href="flyer.html">Print a flyer with a QR code</a></div></div>`;
  document.body.append(foot);

  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in"); io.unobserve(e.target);
    const n = e.target.querySelector("[data-to]");
    if (n && !still) {
      const to = +n.dataset.to, plus = n.hasAttribute("data-plus"), t0 = performance.now();
      const step = now => { const k = Math.min(1, (now - t0) / 1400); n.textContent = Math.round(to * (1 - Math.pow(1 - k, 4))).toLocaleString() + (plus && k === 1 ? "+" : ""); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
  }), { threshold: .15 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  const clock = document.getElementById("clock");
  if (clock) { const tick = () => clock.textContent = new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour12: false }); tick(); setInterval(tick, 1000); }
})();
