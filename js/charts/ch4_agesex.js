/* ch4_agesex.js | Chapter 4: animated population pyramid (year slider) + custom Sankey (age group -> road user).
   (The remoteness chart moved to Chapter 5, "Where?", where it belongs.)
   GenAI: AI-assisted (Claude, Anthropic). Written by Claude from the team's prompts, then checked by the team. Prompt summary: js/config.js. */
import { C, KEYS, COL, SEX_COL, AGES, group } from "../config.js";
import { fmt, pct, makeFig, addTable, svgIn, tipOn, slider, onResize } from "../utils.js";

export function render(el, D) {
  const rows = D.agesex.filter((d) => d.age_group !== "Other/unknown"); // unknown age is excluded from charts
  let year = 2021,
    user = "All";

  const pyramidFig = makeFig(el, {
    title: "Who is hurt, by age and sex",
    sub: "Hospitalisations by age group: women left, men right (colour = sex). Dashed outline = 2011, for comparison",
    cls: "c4",
  });
  const sankeyFig = makeFig(el, {
    title: "Which age groups ride, walk or drive into hospital",
    sub: "Flow from age group to road user for the selected year (Sankey; colour = road user). Highlights the road user chosen in the filter above",
  });

  // Readout: states the headline numbers so they are visible without dragging the slider
  const readout = pyramidFig.f.insert("p", "figcaption").attr("class", "note");
  // Road-user filter: affects the pyramid and highlights the matching Sankey flows
  const select = pyramidFig.ctl
    .append("label")
    .text("Road user ")
    .append("select")
    .on("change", () => {
      user = select.node().value;
      drawPyramid();
    });
  select
    .selectAll("option")
    .data(["All", ...KEYS.filter((k) => k !== "Other / unknown")])
    .join("option")
    .text((d) => (d === "All" ? "All road users" : d))
    .attr("value", (d) => d);
  // Shortcut to the Chapter 4 finding "cyclists aged 40-64 rose 68%": filter to cyclists, then compare 2011 and 2021
  pyramidFig.ctl
    .append("button")
    .attr("class", "btn")
    .attr("type", "button")
    .text("Show cyclists only")
    .on("click", () => {
      user = "Pedal cyclist";
      select.node().value = user;
      drawPyramid();
    });
  slider(pyramidFig.ctl, {
    min: 2011,
    max: 2021,
    value: year,
    label: "Year",
    cb: (v) => {
      year = v;
      update();
    },
  });

  // casesBy(user, year) -> Map(ageGroup -> Map(sex -> cases))
  const casesBy = (u, y) =>
    d3.rollup(
      rows.filter((d) => d.year === y && (u === "All" || group(d.road_user) === u) && ["Male", "Female"].includes(d.sex)),
      (v) => d3.sum(v, (d) => d.hospitalisations),
      (d) => d.age_group,
      (d) => d.sex,
    );
  addTable(
    pyramidFig,
    ["Year", "Age group", "Sex", "Road user", "Cases"],
    rows
      .filter((d) => d.year === 2011 || d.year === 2021)
      .map((d) => [d.year, d.age_group, d.sex, d.road_user, fmt(d.hospitalisations)])
      .slice(0, 400),
  );

  let pyramid; // scales and bars shared by drawPyramid() and update()

  // Build the pyramid skeleton (on load, resize and road-user change)
  function drawPyramid() {
    const gap = 64; // space in the middle for age labels
    const s = svgIn(
      pyramidFig.box,
      AGES.length * 42 + 70,
      { t: 34, r: 10, b: 36, l: 10 },
      "Population pyramid of hospitalisations by age group and sex",
    );
    let max = 0; // fixed scale across all years so bars grow/shrink honestly while animating
    for (let y = 2011; y <= 2021; y++)
      casesBy(user, y).forEach((m) =>
        m.forEach((v) => {
          max = Math.max(max, v);
        }),
      );
    const half = (s.w - gap) / 2;
    const xMale = d3.scaleLinear([0, max], [s.w / 2 + gap / 2, s.w]);
    const xFemale = d3.scaleLinear([0, max], [s.w / 2 - gap / 2, 0]);
    const y = d3.scaleBand(AGES, [0, s.h - 6]).padding(0.18);
    const ticks = Math.max(2, Math.floor(half / 90));
    s.g
      .append("g")
      .attr("class", "ax")
      .attr("transform", `translate(0,${s.h - 6})`)
      .call(d3.axisBottom(xMale).ticks(ticks).tickFormat(d3.format("~s")));
    s.g
      .append("g")
      .attr("class", "ax")
      .attr("transform", `translate(0,${s.h - 6})`)
      .call(d3.axisBottom(xFemale).ticks(ticks).tickFormat(d3.format("~s")));
    s.g
      .append("text")
      .attr("x", xFemale(0) - 6)
      .attr("y", -14)
      .attr("text-anchor", "end")
      .attr("font-weight", 700)
      .attr("font-size", 15)
      .text("◀ Female");
    s.g
      .append("text")
      .attr("x", xMale(0) + 6)
      .attr("y", -14)
      .attr("font-weight", 700)
      .attr("font-size", 15)
      .text("Male ▶");
    s.g
      .selectAll(".al")
      .data(AGES)
      .join("text")
      .attr("x", s.w / 2)
      .attr("y", (d) => y(d) + y.bandwidth() / 2 + 5)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .attr("font-weight", 700)
      .text((d) => d);

    // Dashed 2011 outline behind the bars: shows change since 2011 at a glance
    const cells = AGES.flatMap((a) => ["Female", "Male"].map((sex) => ({ a, sex })));
    const ghost = s.g
      .selectAll("rect.g")
      .data(cells)
      .join("rect")
      .attr("class", "g")
      .attr("fill", "none")
      .attr("stroke", C.ink)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4 3")
      .attr("y", (d) => y(d.a))
      .attr("height", y.bandwidth())
      .style("pointer-events", "none");
    const bars = s.g
      .selectAll("rect.b")
      .data(AGES.flatMap((a) => ["Female", "Male"].map((sex) => ({ a, sex }))))
      .join("rect")
      .attr("class", "b")
      .attr("fill", (d) => SEX_COL[d.sex])
      .attr("stroke", C.ink)
      .attr("stroke-width", 2)
      .attr("y", (d) => y(d.a))
      .attr("height", y.bandwidth())
      .attr("aria-label", (d) => `${d.a} ${d.sex}`);
    pyramid = { bars, ghost, xMale, xFemale };
    tipOn(bars, (d) => `<b>${d.a}, ${d.sex}</b><br>${fmt(casesBy(user, year).get(d.a)?.get(d.sex) || 0)} cases in ${year}`);
    update(true);
  }

  // Animate the bars to the selected year and redraw the Sankey
  function update(immediate) {
    if (!pyramid) return;
    const m = casesBy(user, year),
      value = (d) => m.get(d.a)?.get(d.sex) || 0;
    pyramid.bars
      .transition()
      .duration(immediate ? 0 : 600)
      .attr("x", (d) => (d.sex === "Male" ? pyramid.xMale(0) : pyramid.xFemale(value(d))))
      .attr("width", (d) =>
        d.sex === "Male" ? pyramid.xMale(value(d)) - pyramid.xMale(0) : pyramid.xFemale(0) - pyramid.xFemale(value(d)),
      );
    const m0 = casesBy(user, 2011),
      v0 = (d) => m0.get(d.a)?.get(d.sex) || 0;
    pyramid.ghost
      .attr("x", (d) => (d.sex === "Male" ? pyramid.xMale(0) : pyramid.xFemale(v0(d))))
      .attr("width", (d) =>
        d.sex === "Male" ? pyramid.xMale(v0(d)) - pyramid.xMale(0) : pyramid.xFemale(0) - pyramid.xFemale(v0(d)),
      );
    const sexSum = (mm, sex) => d3.sum(AGES, (a) => mm.get(a)?.get(sex) || 0);
    const ageSum = (mm, a) => d3.sum(["Male", "Female"], (sx) => mm.get(a)?.get(sx) || 0);
    const all = sexSum(m, "Male") + sexSum(m, "Female");
    const change = (a) => (ageSum(m0, a) ? pct((ageSum(m, a) / ageSum(m0, a) - 1) * 100) : "n/a");
    readout.text(
      all
        ? `${user === "All" ? "All road users" : user}, ${year}: men are ${Math.round((sexSum(m, "Male") / all) * 100)}% of cases. Versus 2011 (dashed outline): ages 17–25 ${change("17-25")}, ages 40–64 ${change("40-64")}, ages 65–74 ${change("65-74")} (counts, not risk).`
        : "",
    );
    drawSankey();
  }

  // Custom Sankey written with plain d3 (d3-sankey is not used): left nodes = age groups, right nodes = road users
  function drawSankey() {
    const flows = d3.rollup(
      rows.filter((d) => d.year === year),
      (v) => d3.sum(v, (d) => d.hospitalisations),
      (d) => d.age_group,
      (d) => group(d.road_user),
    );
    const s = svgIn(
      sankeyFig.box,
      400,
      { t: 8, r: Math.min(130, innerWidth * 0.28), b: 8, l: 46 },
      `Sankey of age group to road user, ${year}`,
    );
    const pad = 16, // gap between nodes: large enough for 14px labels on the right column
      nodeW = 12;
    const cell = (a, k) => flows.get(a)?.get(k) || 0;
    const total = d3.sum(AGES, (a) => d3.sum(KEYS, (k) => cell(a, k)));
    const scale = (s.h - pad * (KEYS.length - 1)) / total; // pixels per case (right column has the most gaps)
    const left = {},
      right = {};
    let cursor = pad / 2; // centre the left column (it has fewer gaps)
    AGES.forEach((a) => {
      const h = d3.sum(KEYS, (k) => cell(a, k)) * scale;
      left[a] = { y: cursor, h, used: 0 };
      cursor += h + pad;
    });
    cursor = 0;
    KEYS.forEach((k) => {
      const h = d3.sum(AGES, (a) => cell(a, k)) * scale;
      right[k] = { y: cursor, h, used: 0 };
      cursor += h + pad;
    });

    const links = [];
    AGES.forEach((a) =>
      KEYS.forEach((k) => {
        const v = cell(a, k),
          h = v * scale;
        if (!v) return;
        links.push({ a, k, v, h, sy: left[a].y + left[a].used + h / 2, ty: right[k].y + right[k].used + h / 2 });
        left[a].used += h;
        right[k].used += h;
      }),
    );

    const focus = user === "All" ? null : user; // road user chosen in the dropdown
    const paths = s.g
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("d", (d) => d3.linkHorizontal()({ source: [nodeW, d.sy], target: [s.w - nodeW, d.ty] }))
      .attr("fill", "none")
      .attr("stroke", (d) => (COL[d.k] === C.yellow ? "#c9bd00" : COL[d.k]))
      .attr("stroke-width", (d) => Math.max(1, d.h))
      .attr("opacity", (d) => (focus ? (d.k === focus ? 0.85 : 0.1) : 0.45))
      .attr("aria-label", (d) => `${d.a} to ${d.k}: ${fmt(d.v)}`);
    tipOn(paths, (d) => `<b>${d.a} → ${d.k}</b><br>${fmt(d.v)} cases in ${year}`);

    AGES.forEach((a) => {
      s.g
        .append("rect")
        .attr("x", 0)
        .attr("y", left[a].y)
        .attr("width", nodeW)
        .attr("height", Math.max(1, left[a].h))
        .attr("fill", C.ink);
      s.g
        .append("text")
        .attr("x", -6)
        .attr("y", left[a].y + left[a].h / 2 + 5)
        .attr("text-anchor", "end")
        .attr("font-size", 14)
        .text(a);
    });
    KEYS.forEach((k) => {
      s.g
        .append("rect")
        .attr("x", s.w - nodeW)
        .attr("y", right[k].y)
        .attr("width", nodeW)
        .attr("height", Math.max(1, right[k].h))
        .attr("fill", COL[k])
        .attr("stroke", C.ink);
      s.g
        .append("text")
        .attr("x", s.w + 6)
        .attr("y", right[k].y + Math.max(right[k].h, 14) / 2 + 4)
        .attr("font-size", 14)
        .text(k);
    });
  }

  drawPyramid();
  onResize(drawPyramid);
}
