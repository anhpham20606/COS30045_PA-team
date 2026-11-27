/* main.js | Builds chapter shells, wires modules, nav progress. Chart code lives in js/charts/.
   GenAI: AI-assisted (Claude, Anthropic). Written by Claude from the team's prompts, then checked by the team. Prompt summary: js/config.js. */
import { CHAPTERS, TRANS, FACING } from "./config.js";
import { loadAll } from "./data.js";
import { initTransitions } from "./transitions.js";
import { initEndScene } from "./endscene.js";
import { initTrail } from "./trail.js";
import { fillTokens } from "./utils.js";
import * as c1 from "./charts/ch1_trend.js";
import * as c2 from "./charts/ch2_heatmap.js";
import * as c3 from "./charts/ch3_roaduser.js";
import * as c4 from "./charts/ch4_agesex.js";
import * as c5 from "./charts/ch5_states.js";
import * as c6 from "./charts/ch6_firstnations.js";
import * as c7 from "./charts/ch7_limitations.js";
const mods = [c1, c2, c3, c4, c5, c6, c7];
const main = document.getElementById("story"),
  nav = document.getElementById("nav");
CHAPTERS.forEach((c, i) => {
  const n = i + 1,
    t = TRANS[i];
  main.insertAdjacentHTML(
    "beforeend",
    `
  <div class="strip" role="presentation" data-d="${t.d}" data-flip="${FACING[t.v] !== t.d ? 1 : 0}">
    <a class="skip" href="#ch${n}" tabindex="0">Skip animation</a>
    <div class="cap" aria-hidden="true">${t.cap}</div>
    <img class="deco px" style="left:12%" src="assets/img/traffic_cone.png" alt="">
    <img class="deco px" style="left:62%" src="assets/img/traffic_cone.png" alt="">
    ${t.barrier ? '<img class="deco px" style="right:2%;height:150px" src="assets/img/roadwork_barrier.png" alt="">' : ""}
    <img class="veh px" style="--vh:${t.h}px" src="assets/img/${t.v}.png" alt="">
    <div class="road"></div></div>
  <section class="chapter" id="ch${n}" aria-labelledby="h${n}">
    <span class="badge">CHAPTER ${n} / 7</span><h2 id="h${n}">${c.q}</h2><p class="lead">${c.lead}</p>
    <div class="charts"></div>
    <div class="sowhat"><img class="px" src="assets/img/traffic_cone.png" alt=""><p><b>So what?</b> ${c.so}</p></div>
    <p class="bridge">${c.bridge}</p><p class="note"><b>Data note:</b> ${c.note}</p></section>`,
  );
  nav.insertAdjacentHTML(
    "beforeend",
    `<a href="#ch${n}" aria-label="Chapter ${n}: ${c.q}"><img class="px" src="assets/img/traffic_cone.png" alt=""><span>${n}</span></a>`,
  );
});
initTransitions();
initEndScene();
function setNav() {
  const links = [...nav.children];
  let cur = -1;
  CHAPTERS.forEach((_, i) => {
    if (document.getElementById("ch" + (i + 1)).getBoundingClientRect().top < innerHeight * 0.4) cur = i;
  });
  links.forEach((a, i) => {
    a.dataset.s = i < cur ? "done" : i === cur ? "cur" : "todo";
    a.toggleAttribute("aria-current", i === cur);
    if (i === cur) a.setAttribute("aria-current", "true");
  });
}
const lamp = document.getElementById("lamp");
function setLamp() {
  let cur = -1;
  CHAPTERS.forEach((_, i) => {
    if (document.getElementById("ch" + (i + 1)).getBoundingClientRect().top < innerHeight * 0.4) cur = i;
  });
  lamp.dataset.s = cur < 0 ? "r" : cur < CHAPTERS.length - 1 ? "y" : "g";
}
addEventListener("scroll", setLamp, { passive: true });
setLamp();
addEventListener("scroll", setNav, { passive: true });
setNav();
loadAll()
  .then((D) => {
    if (D.deaths) document.getElementById("deathsSrc").hidden = false;
    return D;
  })
  .then((D) => {
    mods.forEach((m, i) => {
      try {
        m.render(document.querySelector(`#ch${i + 1} .charts`), D);
      } catch (e) {
        console.error(e);
        showErr(i);
      }
    });
    fillTokens(D); // after all charts exist: rates in chapter text and limitation cards come from data/road_trauma_rates.csv
  })
  .then(() => initTrail()) // pixel road needs the finished card heights
  .catch((e) => {
    console.error(e);
    document.querySelectorAll(".charts").forEach((el, i) => showErr(i));
  });
function showErr(i) {
  document.querySelector(`#ch${i + 1} .charts`).innerHTML =
    '<div class="card"><b>Oops, the road is closed.</b> This chart could not load. Please refresh the page.</div>';
}
