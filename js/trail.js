/* trail.js | "The Pixel Road": one road runs from the START sign through every chart card (STOP 1.1, 1.2, ...) to the FINISH line.
   It is drawn BEHIND the cards (z-index -1) so it appears to enter each chart at a numbered gate on the top edge and leave at an arrow gate on the bottom edge.
   Scrolling "drives" a small car along the road and lights up the yellow centre line; gates turn white (to do) / yellow (you are here) / green (done).
   Pure decoration (aria-hidden): the story itself is unchanged for keyboard and screen-reader users. Honors prefers-reduced-motion (road fully lit, no car).
   GenAI: AI-assisted (Claude, Anthropic). Written by Claude from the team's prompts, then checked by the team. Prompt summary: js/config.js. */

const NS = "http://www.w3.org/2000/svg";
const GRID = 8; // everything snaps to an 8px grid = pixel look
const snap = (v) => Math.round(v / GRID) * GRID;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Tiny helper to create SVG nodes
function node(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

export function initTrail() {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; // A11Y
  if (document.getElementById("trailRoad")) return; // run once

  // ---------- START sign (HTML, lives at the bottom of the hero) ----------
  const hero = document.querySelector(".hero");
  let sign = hero && hero.querySelector(".trail-start");
  if (hero && !sign) {
    hero.insertAdjacentHTML(
      "beforeend",
      `<div class="trail-start" aria-hidden="true">
         <svg viewBox="0 0 8 8" width="32" height="32" shape-rendering="crispEdges"><rect x="1" y="0" width="1" height="8" fill="#1b1b3a"/><rect x="2" y="0" width="5" height="1" fill="#d55e00"/><rect x="2" y="1" width="5" height="3" fill="#d55e00"/><rect x="2" y="2" width="2" height="1" fill="#fff8e7"/><rect x="5" y="3" width="1" height="1" fill="#fff8e7"/></svg>
         <b>START</b></div>`,
    );
    sign = hero.querySelector(".trail-start");
  }

  // ---------- two SVG layers ----------
  const roadSvg = node("svg", { id: "trailRoad", "aria-hidden": "true", focusable: "false" }); // behind cards
  const topSvg = node("svg", { id: "trailTop", "aria-hidden": "true", focusable: "false" }); // gates + car above cards
  document.body.prepend(roadSvg);
  document.body.append(topSvg);

  const defs = node("defs", {}, roadSvg);
  const mask = node("mask", { id: "trailMask", maskUnits: "userSpaceOnUse", x: 0, y: 0, width: "100%", height: "100%" }, defs);
  const maskPath = node("path", { fill: "none", stroke: "#fff", "stroke-width": 24 }, mask); // reveals the lit part of the centre line
  const pOutline = node("path", { class: "t-outline" }, roadSvg);
  const pKerb = node("path", { class: "t-kerb" }, roadSvg);
  const pAsphalt = node("path", { class: "t-asphalt" }, roadSvg);
  const pDim = node("path", { class: "t-dash t-dim" }, roadSvg); // all centre dashes (grey)
  const pLit = node("path", { class: "t-dash t-lit", mask: "url(#trailMask)" }, roadSvg); // yellow dashes, revealed by scroll
  const gateLayer = node("g", {}, topSvg);
  const finishLayer = node("g", {}, topSvg);
  const car = node("g", { class: "t-car" }, topSvg);
  const u = 2; // car pixel size
  [
    // [x, y, w, h, fill] in car pixels, car faces +x
    [-5, -3, 10, 6, "#d55e00"], // body
    [-5, -3, 10, 1, "#1b1b3a"], [-5, 2, 10, 1, "#1b1b3a"], [-5, -3, 1, 6, "#1b1b3a"], [4, -3, 1, 6, "#1b1b3a"], // outline
    [1, -2, 2, 4, "#56b4e9"], // windscreen
    [-3, -2, 1, 4, "#56b4e9"], // rear window
    [3, -2, 1, 1, "#f0e442"], [3, 1, 1, 1, "#f0e442"], // headlights
    [-4, -4, 2, 1, "#1b1b3a"], [1, -4, 2, 1, "#1b1b3a"], [-4, 3, 2, 1, "#1b1b3a"], [1, 3, 2, 1, "#1b1b3a"], // wheels
  ].forEach(([x, y, w, h, f]) => node("rect", { x: x * u, y: y * u, width: w * u, height: h * u, fill: f }, car));

  // ---------- layout state (rebuilt on resize / height change) ----------
  let L = 0, // total road length
    cum = [], // cumulative length at each vertex
    pts = [], // road vertices (page coordinates)
    keys = [], // keyframes: [readingLineY, roadLength]
    cards = [], // {card, top, bottom, aIdx, bIdx, gate}
    strips = [], // page-Y ranges of the full-width vehicle strips (road hides behind them like a tunnel)
    roadW = 16;

  function build() {
    const sy = scrollY,
      H = innerHeight;
    const firstChapter = document.querySelector(".chapter");
    if (!firstChapter) return;
    const fr = firstChapter.getBoundingClientRect();
    const contentLeft = fr.left + 20; // chapters have 20px side padding
    const wide = contentLeft - 40 >= 32; // desktop has a gutter; phones do not
    const laneX = wide ? snap(contentLeft - 40) : 10; // free "lane" left of the content for long vertical runs
    roadW = wide ? 16 : 8; // thin road on phones, kept inside the 20px page padding

    // stops = chart cards (the small <details> limitation cards are not stops)
    const els = [...document.querySelectorAll(".charts > .card:not(.limit)")];
    const chapIndex = {};
    cards = els.map((card) => {
      const r = card.getBoundingClientRect(),
        chap = card.closest(".chapter").id;
      chapIndex[chap] = (chapIndex[chap] || 0) + 1;
      const inset = clamp(r.width * 0.1, 24, 64);
      return {
        card,
        chap,
        label: chap.replace("ch", "") + "." + chapIndex[chap],
        top: r.top + sy,
        bottom: r.bottom + sy,
        xIn: snap(r.left + inset), // enter on the left...
        xOut: snap(r.right - inset), // ...leave on the right (snake shape)
      };
    });
    if (!cards.length) return;

    // start point = bottom centre of the START sign
    const sr = sign.getBoundingClientRect();
    const start = { x: snap(sr.left + sr.width / 2), y: snap(sr.bottom + sy) };

    // end point = top of the END scene, finish line just above
    const endEl = document.getElementById("end"),
      footer = document.querySelector("footer");
    const endTop = endEl.getBoundingClientRect().top + sy;
    const footBottom = footer ? footer.getBoundingClientRect().bottom + sy : endTop - 72;
    const endX = snap(document.documentElement.clientWidth / 2);

    strips = [...document.querySelectorAll(".strip")].map((s) => {
      const r = s.getBoundingClientRect();
      return [r.top + sy, r.bottom + sy];
    });

    // ---- build the polyline ----
    pts = [start];
    const push = (x, y) => {
      const p = pts[pts.length - 1];
      if (p.x !== x || p.y !== y) pts.push({ x, y });
    };
    // short hop between two cards of the same chapter: drop, cross the gap, drop
    const gap = (from, to) => {
      const mid = snap((from.y + to.y) / 2);
      push(from.x, mid);
      push(to.x, mid);
      push(to.x, to.y);
    };
    // long trip (new chapter, strip, text in between): leave below the card, join the lane, run down, turn in above the next card
    const lane = (from, to, down) => {
      push(from.x, snap(from.y + down));
      push(laneX, snap(from.y + down));
      push(laneX, snap(to.y - 36));
      push(to.x, snap(to.y - 36));
      push(to.x, to.y);
    };
    cards.forEach((c, i) => {
      const prev = i ? cards[i - 1] : null;
      const from = prev ? { x: prev.xOut, y: snap(prev.bottom) } : start;
      const E = { x: c.xIn, y: snap(c.top) };
      const sameBlock = prev && prev.chap === c.chap && c.card.previousElementSibling === prev.card;
      if (sameBlock) gap(from, E);
      else lane(from, E, prev ? 36 : 20);
      c.aIdx = pts.length - 1; // entry vertex
      const mid = snap((c.top + c.bottom) / 2); // hidden run behind the card
      push(c.xIn, mid);
      push(c.xOut, mid);
      push(c.xOut, snap(c.bottom));
      c.bIdx = pts.length - 1; // exit vertex
    });
    const last = cards[cards.length - 1];
    const fy = snap(Math.max(footBottom + 36, last.bottom + 72));
    push(last.xOut, snap(last.bottom + 36));
    push(laneX, snap(last.bottom + 36));
    push(laneX, fy);
    push(endX, fy);
    push(endX, snap(endTop));

    // ---- lengths ----
    cum = [0];
    for (let i = 1; i < pts.length; i++) cum[i] = cum[i - 1] + Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y);
    L = cum[cum.length - 1];

    // ---- keyframes: reading line (page Y at 50% of the screen) -> road length ----
    // The car reaches a card's gate shortly after the card's top passes screen centre and leaves its exit gate shortly before the bottom does,
    // so the long horizontal hops between cards get ~half a screen of scrolling and look smooth.
    keys = [[start.y, 0]];
    cards.forEach((c) => {
      const o = Math.min(0.25 * H, (c.bottom - c.top) * 0.4);
      keys.push([c.top + o, cum[c.aIdx]], [c.bottom - o, cum[c.bIdx]]);
    });
    keys.push([endTop, L]);
    for (let i = 1; i < keys.length; i++) keys[i][0] = Math.max(keys[i][0], keys[i - 1][0] + 1); // keep increasing

    // ---- draw road ----
    const d = pts.map((p, i) => (i ? "L" : "M") + p.x + " " + p.y).join(" ");
    [pOutline, pKerb, pAsphalt, pDim, pLit, maskPath].forEach((p) => p.setAttribute("d", d));
    pOutline.setAttribute("stroke-width", wide ? roadW + 16 : roadW + 6);
    pKerb.setAttribute("stroke-width", wide ? roadW + 8 : roadW + 2);
    pAsphalt.setAttribute("stroke-width", roadW);
    const dash = roadW >= 16 ? "16 16" : "8 8";
    pDim.setAttribute("stroke-dasharray", dash);
    pLit.setAttribute("stroke-dasharray", dash);
    pDim.setAttribute("stroke-width", roadW >= 16 ? 4 : 2);
    pLit.setAttribute("stroke-width", roadW >= 16 ? 4 : 2);

    // ---- gates (above the cards) ----
    gateLayer.replaceChildren();
    cards.forEach((c, i) => {
      // entry gate: numbered sign straddling the top edge of the card
      const g = node("g", { class: "t-gate", "data-s": "todo" }, gateLayer);
      const gx = c.xIn - 24,
        gy = c.top - 14;
      node("rect", { x: gx + 3, y: gy + 3, width: 48, height: 28, fill: "#1b1b3a" }, g);
      node("rect", { class: "t-box", x: gx, y: gy, width: 48, height: 28, stroke: "#1b1b3a", "stroke-width": 3 }, g);
      const t = node("text", { class: "t-num", x: c.xIn, y: gy + 19, "text-anchor": "middle" }, g);
      t.textContent = c.label;
      // exit gate: down arrow on the bottom edge
      const ex = node("g", { class: "t-gate t-exit", "data-s": "todo" }, gateLayer);
      const bx = c.xOut - 14,
        by = c.bottom - 10;
      node("rect", { x: bx + 3, y: by + 3, width: 28, height: 24, fill: "#1b1b3a" }, ex);
      node("rect", { class: "t-box", x: bx, y: by, width: 28, height: 24, stroke: "#1b1b3a", "stroke-width": 3 }, ex);
      node("path", { d: `M${c.xOut - 8} ${by + 7}h16v4h-4v4h-4v4h-4v-4h-4v-4h-4z`, fill: "#1b1b3a" }, ex);
      c.gate = [g, ex];
      c.state = "";
    });

    // ---- finish line: chequered strip across the road + label ----
    finishLayer.replaceChildren();
    const fw = roadW + 16,
      cols = Math.ceil(fw / 8),
      fx = endX - (cols * 8) / 2,
      fyy = snap(endTop) - 28;
    for (let r = 0; r < 2; r++)
      for (let k = 0; k < cols; k++)
        node("rect", { x: fx + k * 8, y: fyy + r * 8, width: 8, height: 8, fill: (r + k) % 2 ? "#fff" : "#1b1b3a" }, finishLayer);
    const ft = node("text", { class: "t-num t-finish", x: fx + cols * 8 + 12, y: fyy + 14 }, finishLayer);
    ft.textContent = "FINISH";

    // START label next to the road start is the HTML sign; nothing to draw here
    update(true);
  }

  // length -> point and direction on the road
  function at(s) {
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const a = pts[i - 1],
      b = pts[i],
      seg = cum[i] - cum[i - 1] || 1,
      t = clamp((s - cum[i - 1]) / seg, 0, 1);
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dx: Math.sign(b.x - a.x), dy: Math.sign(b.y - a.y) };
  }
  // reading line -> road length (piecewise linear between keyframes)
  function lengthFor(R) {
    if (R <= keys[0][0]) return 0;
    for (let i = 1; i < keys.length; i++) {
      if (R <= keys[i][0]) {
        const [r0, s0] = keys[i - 1],
          [r1, s1] = keys[i];
        return s0 + ((R - r0) / (r1 - r0)) * (s1 - s0);
      }
    }
    return L;
  }

  function update() {
    if (!L) return;
    const R = scrollY + innerHeight * 0.5; // reading line
    let s = reduce ? L : lengthFor(R);
    s = Math.round(s / 4) * 4; // stepped = pixel feel
    maskPath.setAttribute("stroke-dasharray", `${s} ${L + 100}`);

    // gates + card highlight
    cards.forEach((c) => {
      const st = R > c.bottom ? "done" : R >= c.top ? "cur" : "todo";
      if (st !== c.state) {
        c.state = st;
        c.gate.forEach((g) => g.setAttribute("data-s", st));
        c.card.dataset.trail = st;
      }
    });

    // car: hidden while "inside" a chart card or a vehicle strip (tunnel), otherwise parked/driving on the road
    const p = at(s);
    const inCard = cards.some((c) => s > cum[c.aIdx] + 1 && s < cum[c.bIdx] - 1);
    const inStrip = strips.some(([a, b]) => p.y > a && p.y < b);
    const deg = p.dy > 0 ? 90 : p.dx < 0 ? 180 : 0;
    car.setAttribute("transform", `translate(${snap(p.x)},${snap(p.y)}) rotate(${deg})`);
    car.style.opacity = reduce || inCard || inStrip ? 0 : 1;
  }

  // ---------- events ----------
  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      update();
    });
  };
  let tb = 0;
  const rebuild = () => {
    cancelAnimationFrame(tb);
    tb = requestAnimationFrame(build);
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", rebuild);
  new ResizeObserver(rebuild).observe(document.body); // charts redraw, <details> open/close, fonts load: page height changes
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
  build();
}
