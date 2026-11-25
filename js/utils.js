/* utils.js | Shared helpers: formatters, figure cards, tooltip, keyboard focus, controls, resize.
   Accessibility code is marked A11Y. GenAI: AI-assisted (Claude, Anthropic). Written by Claude from the team's prompts, then checked by the team. Prompt summary: js/config.js. */
import { SRC } from "./config.js";

export const fmt = d3.format(",");
export const pct = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(Math.round(v)) + "%";
export const pts = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1) + " pts"; // percentage-point change
export const announce = (text) => {
  document.getElementById("live").textContent = text;
}; // A11Y: screen-reader live region

// ---------- tooltip ----------
const tipEl = () => document.getElementById("tip");
export function showTip(html, x, y) {
  const t = tipEl();
  t.innerHTML = html;
  t.style.display = "block";
  const w = t.offsetWidth,
    h = t.offsetHeight;
  t.style.left = Math.max(6, Math.min(innerWidth - w - 6, x + 14)) + "px"; // keep the tip on screen
  t.style.top = Math.max(6, Math.min(innerHeight - h - 6, y - h - 10)) + "px";
}
export const hideTip = () => {
  tipEl().style.display = "none";
};
// Touch devices have no mouseleave: tapping anywhere that is not a chart mark closes the tip
document.addEventListener("click", (e) => {
  if (!e.target.closest("[tabindex]")) hideTip();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideTip();
}); // A11Y: Esc closes the tip

// Tooltip on hover, keyboard focus and tap.
// A11Y: roving tabindex. Only ONE mark per chart is a Tab stop; arrow keys move between marks.
// (Before, every mark was a Tab stop, e.g. 132 stops in the heatmap.)
export function tipOn(selection, htmlFor) {
  const nodes = selection.nodes();
  selection
    .attr("tabindex", (d, i) => (i === 0 ? 0 : -1))
    .attr("role", function () {
      return this.getAttribute("role") || "img"; // A11Y: every mark is an image with a text label
    })
    .attr("aria-label", function (d) {
      return this.getAttribute("aria-label") || htmlFor(d).replace(/<br>/g, ", ").replace(/<[^>]+>/g, "");
    })
    .on("mousemove focus click", (event, d) => {
      const rect = event.type === "focus" ? event.target.getBoundingClientRect() : null;
      showTip(htmlFor(d), rect ? rect.left + rect.width / 2 : event.clientX, rect ? rect.top : event.clientY);
    })
    .on("mouseleave blur", hideTip)
    .on("keydown.roving", (event) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!step) return;
      const next = nodes[nodes.indexOf(event.currentTarget) + step];
      if (!next) return;
      event.preventDefault();
      event.currentTarget.setAttribute("tabindex", -1);
      next.setAttribute("tabindex", 0);
      next.focus();
    });
  return selection;
}

// ---------- figure card ----------
export function makeFig(parent, { title, sub, cls = "", src = SRC }) {
  const f = d3
    .select(parent)
    .append("figure")
    .attr("class", "card " + cls);
  f.append("h3").text(title);
  f.append("p").attr("class", "sub").text(sub);
  const ctl = f.append("div").attr("class", "ctl"); // controls row (buttons, slider, select)
  const box = f.append("div").attr("class", "box"); // chart container
  f.append("figcaption").attr("class", "src").text(src);
  return { f, ctl, box: box.node() };
}

// A11Y: every chart has a text alternative (collapsible data table)
export function addTable(fig, head, rows) {
  const d = fig.f.append("details");
  d.append("summary").text("View data table");
  const table = d
    .append("div")
    .attr("class", "tbl")
    .attr("tabindex", 0)
    .attr("role", "region")
    .attr("aria-label", "Data table")
    .append("table");
  table
    .append("tr")
    .selectAll("th")
    .data(head)
    .join("th")
    .attr("scope", "col")
    .text((h) => h);
  table
    .selectAll("tr.r")
    .data(rows)
    .join("tr")
    .attr("class", "r")
    .selectAll("td")
    .data((r) => r)
    .join("td")
    .text((c) => c);
}

// SVG scaffold sized to its container (charts are redrawn on resize)
export function svgIn(box, height, margin, label) {
  const W = Math.max(300, box.clientWidth || 300);
  d3.select(box).selectAll("*").remove();
  const svg = d3
    .select(box)
    .append("svg")
    .attr("viewBox", `0 0 ${W} ${height}`)
    .attr("width", W)
    .attr("height", height)
    .attr("role", "group") // A11Y: group (not img) so focusable marks inside stay reachable by screen readers
    .attr("aria-label", label);
  const g = svg.append("g").attr("transform", `translate(${margin.l},${margin.t})`);
  return { svg, g, w: W - margin.l - margin.r, h: height - margin.t - margin.b, W };
}
export function onResize(redraw) {
  let timer;
  addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(redraw, 200);
  }); // debounced
}

// ---------- controls ----------
export function segmented(ctl, options, current, onChange, label = "Display") {
  const group = ctl.append("div").attr("class", "seg").attr("role", "group").attr("aria-label", label);
  const buttons = group
    .selectAll("button")
    .data(options)
    .join("button")
    .attr("class", "btn")
    .attr("type", "button")
    .text((d) => d[1])
    .attr("aria-pressed", (d) => d[0] === current)
    .on("click", (e, d) => {
      buttons.attr("aria-pressed", (x) => x[0] === d[0]);
      onChange(d[0]);
      announce(`${label}: ${d[1]}`);
    });
}

// Year slider with Play/Pause (used by Chapter 4 pyramid and Chapter 5 map)
export function slider(ctl, { min, max, value, label, cb }) {
  const wrap = ctl.append("label").text(label + " ");
  const out = wrap.append("output").text(value);
  const input = wrap
    .append("input")
    .attr("type", "range")
    .attr("min", min)
    .attr("max", max)
    .attr("value", value)
    .on("input", () => set(+input.node().value));
  const button = ctl.append("button").attr("class", "btn").attr("type", "button").text("Play");
  let timer = null;
  const stop = () => {
    clearInterval(timer);
    timer = null;
    button.text("Play");
  };
  button.on("click", () => {
    if (timer) return stop();
    if (+input.node().value >= max) set(min);
    button.text("Pause");
    timer = setInterval(() => {
      const v = +input.node().value;
      v >= max ? stop() : set(v + 1);
    }, 900);
  });
  function set(v) {
    input.node().value = v;
    out.text(v);
    input.attr("aria-valuetext", "Year " + v);
    cb(v);
    announce("Year " + v);
  }
  return { set };
}
export const axisStyle = (g) => g.attr("class", "ax");

// Linked highlighting: dim every element in the chapter whose data-g differs from the chosen group
export function highlight(root, key) {
  root.querySelectorAll("[data-g]").forEach((n) => n.classList.toggle("dim", key != null && n.dataset.g !== key));
}

// Look up one value from data/road_trauma_rates.csv (AIHW tables 6, 9, 20). Returns null if missing.
export const traumaValue = (D, table, year, group) =>
  (D.trauma || []).find((d) => d.source_table === table && d.year === year && d.group === group)?.value ?? null;

// Replace {{token}} placeholders in chapter text with values read from the CSV (so no rate is typed by hand).
export function fillTokens(D) {
  const f = (v, dp = 0) => (v == null ? "n/a" : v.toFixed(dp));
  const tokens = {
    age65_2017: f(traumaValue(D, "T9", 2017, "65-74 years"), 1),
    age65_2021: f(traumaValue(D, "T9", 2021, "65-74 years"), 1),
    remote_2021: f(traumaValue(D, "T20", 2021, "Remote")),
    regional_2021: f(traumaValue(D, "T20", 2021, "Regional")),
    major_2021: f(traumaValue(D, "T20", 2021, "Major Cities")),
    aihw_2021: fmt(traumaValue(D, "T6", 2021, "Australia") ?? 0),
    bitre_2021: fmt(D.summary.find((d) => d.year === 2021).hospitalisations),
  };
  document.querySelectorAll("#story p, #story details p, #deathsSrc").forEach((el) => {
    if (el.innerHTML.includes("{{")) el.innerHTML = el.innerHTML.replace(/\{\{(\w+)\}\}/g, (m, k) => tokens[k] ?? m);
  });
}
