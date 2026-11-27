/* endscene.js | Scroll-linked END scene: workers abseil down, rope texture runs, sign arrives.
   Honors prefers-reduced-motion (static final pose). GenAI: AI-assisted (Claude, Anthropic). Written by Claude from the team's prompts, then checked by the team. Prompt summary: js/config.js. */
export function initEndScene() {
  const stage = document.querySelector(".end-stage"),
    row = document.getElementById("endRow");
  if (!stage || !row) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; // A11Y
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function update() {
    const r = stage.getBoundingClientRect(),
      H = stage.clientHeight;
    const p = reduce ? 1 : clamp((innerHeight - r.top) / Math.min(innerHeight, H), 0, 1); // 0 = just entering, 1 = fully in view
    const rest = H - 80 - row.offsetHeight - 10; // final top so workers hang above the road
    let y = -row.offsetHeight - 40 + (rest + row.offsetHeight + 40) * p;
    y = Math.round(y / 8) * 8; // stepped = pixel feel
    row.style.transform = `translate(-50%,${y}px)`;
    stage.style.setProperty("--run", Math.round((p * 400) / 8) * 8 + ""); // rope texture slides as they descend
    row.querySelectorAll(".wk").forEach((w) => w.style.setProperty("--run", Math.round((p * 400) / 8) * 8));
  }
  let t = false;
  addEventListener(
    "scroll",
    () => {
      if (!t) {
        t = true;
        requestAnimationFrame(() => {
          update();
          t = false;
        });
      }
    },
    { passive: true },
  );
  addEventListener("resize", update);
  update();
}
