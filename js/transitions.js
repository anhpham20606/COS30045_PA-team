/* transitions.js | Scroll-linked vehicle strips (400px high, 100% wide). Honors prefers-reduced-motion.
   GenAI: AI-assisted (Claude, Anthropic). Written by Claude from the team's prompts, then checked by the team. Prompt summary: js/config.js. */
export function initTransitions() {
  const strips = [...document.querySelectorAll(".strip")];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; // A11Y
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function update() {
    strips.forEach((s) => {
      const veh = s.querySelector(".veh"),
        cap = s.querySelector(".cap");
      const r = s.getBoundingClientRect(),
        W = s.clientWidth,
        vw = veh.offsetWidth,
        dir = s.dataset.d === "l" ? -1 : 1;
      const p = reduce ? 0.5 : clamp((innerHeight - r.top) / (innerHeight + 400), 0, 1); // 0 = entering, 1 = leaving
      const a = dir > 0 ? -vw : W,
        b = dir > 0 ? W : -vw;
      let x = a + (b - a) * p;
      x = Math.round(x / 12) * 12; // stepped = pixel feel
      const bob = reduce ? 0 : (Math.floor(p * 60) % 2) * 3;
      veh.style.transform = `translate3d(${x}px,${-bob}px,0) scaleX(${s.dataset.flip === "1" ? -1 : 1})`;
      cap.style.opacity = reduce ? 1 : clamp((1 - Math.abs(p - 0.5) / 0.3) * 2, 0, 1);
    });
  }
  let ticking = false;
  addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          update();
          ticking = false;
        });
      }
    },
    { passive: true },
  );
  addEventListener("resize", update);
  strips.forEach((s) => s.querySelector(".veh").addEventListener("load", update));
  update();
}
