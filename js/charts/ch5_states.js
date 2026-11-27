/* ch5_states.js | Chapter 5 "Where?": pixel tile map (rates), click-to-drill road-user bars, ranking, small multiples,
   and the remoteness lollipop (moved here from Chapter 4). States with a series break are hatched.
   GenAI: AI-assisted (Claude, Anthropic). Written by Claude from the team's prompts, then checked by the team. Prompt summary: js/config.js. */
import { C, SRC, KEYS, COL, group } from "../config.js";
import { fmt, pct, makeFig, addTable, svgIn, tipOn, slider, onResize } from "../utils.js";

// Tile-map grid position [column, row] of each state or territory
const TILE_POS = { NT: [1, 0], Qld: [2, 0], WA: [0, 1], SA: [1, 1], NSW: [2, 1], ACT: [3, 1], Vic: [2, 2], Tas: [2, 3] };
// 2021 hospitalised injury rate per 100,000 by remoteness: Road Trauma Australia 2024, Table 20 (different release from the BITRE counts)
const REMOTE_RATE_2021 = { "Major Cities": 140.7, Regional: 169.9, Remote: 221.8 };
const RATE_MAX = 350; // highest rate in the data is 337 (NT 2018); one fixed scale is used by map, bars and sparklines

export function render(el, D) {
  const rows = D.state;
  const SRC_STATE = SRC + " Population: ABS, National, state and territory population, Table 4 (ERP at 30 June).";
  let year = 2021,
    selected = null,
    refocus = false;
  // Neutral greys: rate is not a road user, so no road-user hue is reused here
  const ramp = (t) => d3.interpolateGreys(0.1 + 0.8 * t);
  const colour = d3.scaleSequential(ramp).domain([60, RATE_MAX]);

  const mapFig = makeFig(el, {
    title: "Cases per 100,000 people, by state",
    sub: "Tile map: one square per state/territory. Hatched = counting rules changed (do not compare trend). Click a tile for details.",
    src: SRC_STATE,
  });
  const drillFig = makeFig(el, {
    title: "Who is hurt in the selected state?",
    sub: "",
    src: SRC + " Small counts are withheld in the source.",
  });
  const rankFig = makeFig(el, {
    title: "Ranking for the selected year",
    sub: "Open dashed bars with * = counting rules changed (Victoria from 2012, NSW from 2017). Their level is understated, so they are listed last and are not comparable with the others.",
    src: SRC_STATE,
  });
  const sparkFig = makeFig(el, {
    title: "Each state over time",
    sub: "Same scale for all states; the dashed segment marks the year counting rules changed (Victoria 2012, NSW 2017)",
    src: SRC_STATE,
  });
  const remoteFig = makeFig(el, {
    title: "Change by remoteness of home area, 2011 to 2021",
    sub: "Bars = percent change in counts (not rates). Grey text = 2021 rate per 100,000 from a different release (Table 20): remote areas have the higher rate even though their counts fell.",
    src: SRC + " Rates in the subtitle: Road Safety Data Hub, Road Trauma Australia 2024, Table 20 (AIHW 2025, ABS 2024b).",
  });

  slider(mapFig.ctl, {
    min: 2011,
    max: 2021,
    value: year,
    label: "Year",
    cb: (v) => {
      year = v;
      draw();
    },
  });
  addTable(
    mapFig,
    ["Year", "State", "Cases", "Population", "Rate per 100,000", "Series break"],
    rows.map((d) => [
      d.year,
      d.state,
      fmt(d.hospitalisations),
      fmt(d.population),
      d.rate_per_100k.toFixed(1),
      d.series_break ? "yes" : "no",
    ]),
  );

  const rowOf = (state, y) => rows.find((d) => d.state === state && d.year === y);
  const tipHtml = (d) =>
    `<b>${d.state} ${d.year}</b><br>${d.rate_per_100k.toFixed(0)} per 100,000<br>${fmt(d.hospitalisations)} cases, population ${fmt(d.population)}` +
    (d.series_break ? "<br><b>Series break: do not compare trend.</b>" : "");
  const toggleState = (state) => {
    selected = selected === state ? null : state;
    refocus = true;
    draw();
  };

  // ---------- 1) tile map ----------
  function drawMap(data) {
    const tile = Math.min(96, (mapFig.box.clientWidth || 320) / 4.4);
    const s = svgIn(
      mapFig.box,
      tile * 4 + 40,
      { t: 4, r: 4, b: 36, l: 4 },
      `Tile map of hospitalisation rates by state, ${year}`,
    );
    const defs = s.svg.append("defs");
    defs
      .append("pattern")
      .attr("id", "hatch")
      .attr("width", 9)
      .attr("height", 9)
      .attr("patternUnits", "userSpaceOnUse")
      .attr("patternTransform", "rotate(45)")
      .append("rect")
      .attr("width", 3.5)
      .attr("height", 9)
      .attr("fill", C.ink)
      .attr("opacity", 0.45);

    const tiles = s.g
      .selectAll("g")
      .data(data)
      .join("g")
      .attr("transform", (d) => `translate(${TILE_POS[d.state][0] * tile},${TILE_POS[d.state][1] * tile})`)
      .style("cursor", "pointer")
      .attr("role", "button")
      .attr("aria-pressed", (d) => d.state === selected)
      .on("click.select", (e, d) => toggleState(d.state))
      .on("keydown.select", (e, d) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleState(d.state);
        }
      }); // A11Y: keyboard select
    tiles
      .append("rect")
      .attr("width", tile - 6)
      .attr("height", tile - 6)
      .attr("fill", (d) => colour(d.rate_per_100k))
      .attr("stroke", (d) => (d.state === selected ? C.acc : C.ink))
      .attr("stroke-width", (d) => (d.state === selected ? 6 : 3));
    tiles
      .filter((d) => d.series_break)
      .append("rect")
      .attr("width", tile - 6)
      .attr("height", tile - 6)
      .attr("fill", "url(#hatch)")
      .style("pointer-events", "none");
    tiles
      .filter((d) => d.series_break)
      .append("image")
      .attr("href", "assets/img/roadwork_barrier.png")
      .attr("x", tile - 34)
      .attr("y", 2)
      .attr("width", 26)
      .attr("height", 24)
      .style("image-rendering", "pixelated");
    const textColour = (d) => (d3.lab(colour(d.rate_per_100k)).l > 58 ? C.ink : "#fff");
    const fontSize = Math.max(13, tile / 6);
    tiles
      .append("text")
      .attr("x", (tile - 6) / 2)
      .attr("y", (tile - 6) / 2 - 2)
      .attr("text-anchor", "middle")
      .attr("font-weight", 700)
      .attr("font-size", fontSize)
      .style("fill", textColour)
      .text((d) => d.state);
    tiles
      .append("text")
      .attr("x", (tile - 6) / 2)
      .attr("y", (tile - 6) / 2 + Math.max(16, tile / 5))
      .attr("text-anchor", "middle")
      .attr("font-size", fontSize)
      .style("fill", textColour)
      .text((d) => d.rate_per_100k.toFixed(0));
    tipOn(tiles, tipHtml).attr(
      "aria-label",
      (d) =>
        `${d.state}: ${d.rate_per_100k.toFixed(0)} per 100,000. ${d.state === selected ? "Selected." : "Press Enter to select."}`,
    );

    // colour legend
    const legend = s.g.append("g").attr("transform", `translate(${tile * 3},${tile * 3 + 6})`);
    const gradient = defs.append("linearGradient").attr("id", "rateLegend");
    d3.range(0, 1.01, 0.25).forEach((t) =>
      gradient.append("stop").attr("offset", t).attr("stop-color", ramp(t)),
    );
    legend.append("rect").attr("width", 90).attr("height", 12).attr("fill", "url(#rateLegend)").attr("stroke", C.ink);
    legend.append("text").attr("y", 28).attr("font-size", 13).text("60");
    legend.append("text").attr("x", 90).attr("y", 28).attr("text-anchor", "end").attr("font-size", 13).text(String(RATE_MAX));
    if (refocus && selected) {
      tiles
        .filter((d) => d.state === selected)
        .node()
        ?.focus();
    } // keep keyboard focus after redraw
    refocus = false;
  }

  // ---------- 2) drill-down: road users in the selected state ----------
  function drawDrill() {
    drillFig.f.select("h3").text(selected ? `Who is hurt in ${selected}, ${year}?` : "Who is hurt in the selected state?");
    if (!selected) {
      drillFig.f.select(".sub").text("");
      d3.select(drillFig.box).selectAll("*").remove();
      d3.select(drillFig.box)
        .append("p")
        .attr("class", "note")
        .text("Click a state tile above (or press Enter on it) to see which road users are hurt there.");
      return;
    }
    const breakNote = rowOf(selected, year).series_break
      ? " This state has a series break in this year: compare road users, not trends."
      : "";
    drillFig.f
      .select(".sub")
      .text(`Hospitalisations by road user, counts. Open dashed bar = at least this many (small counts withheld); a dash = count withheld.${breakNote}`);
    const data = KEYS.map((k) => {
      const cells = D.stateRU.filter((d) => d.state === selected && d.year === year && group(d.road_user) === k);
      const known = d3.sum(cells, (d) => d.hospitalisations || 0);
      const hidden = d3.sum(cells, (d) => d.suppressed || 0);
      return { k, known, hidden, missing: cells.length > 0 && cells.every((d) => d.hospitalisations == null) };
    });
    const maxAll =
      d3.max(
        D.stateRU.filter((d) => d.state === selected),
        (d) => d.hospitalisations,
      ) || 1; // stable scale across years
    const s = svgIn(
      drillFig.box,
      KEYS.length * 36 + 20,
      { t: 6, r: 70, b: 14, l: Math.min(150, innerWidth * 0.34) },
      `Bar chart of hospitalisations by road user in ${selected}, ${year}`,
    );
    const x = d3.scaleLinear([0, maxAll * 1.15], [0, s.w]);
    const y = d3.scaleBand(KEYS, [0, s.h]).padding(0.25);
    s.g
      .selectAll(".lb")
      .data(KEYS)
      .join("text")
      .attr("x", -8)
      .attr("y", (k) => y(k) + y.bandwidth() / 2 + 5)
      .attr("text-anchor", "end")
      .attr("font-size", 14)
      .text((k) => k);
    const bars = s.g
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("y", (d) => y(d.k))
      .attr("height", y.bandwidth())
      .attr("width", (d) => x(d.known))
      .attr("fill", (d) => (d.hidden > 0 ? "#fff" : COL[d.k]))
      .attr("stroke", C.ink)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", (d) => (d.hidden > 0 ? "5 3" : null))
      .attr("aria-label", (d) => `${d.k}: ${d.missing ? "count withheld" : fmt(d.known)}`);
    tipOn(
      bars,
      (d) =>
        `<b>${d.k}, ${selected} ${year}</b><br>${d.missing ? "Count withheld (small numbers), not zero" : fmt(d.known) + " cases" + (d.hidden > 0 ? "<br>At least this many (some small counts withheld)" : "")}`,
    );
    s.g
      .selectAll(".v")
      .data(data)
      .join("text")
      .attr("x", (d) => x(d.known) + 8)
      .attr("y", (d) => y(d.k) + y.bandwidth() / 2 + 5)
      .attr("font-weight", 700)
      .attr("font-size", 13)
      .text((d) => (d.missing ? "–" : (d.hidden > 0 ? "≥ " : "") + fmt(d.known)));
  }

  // ---------- 3) ranked bars ----------
  function drawRanking(data) {
    // Comparable states first (high to low); series-break states last so they are never ranked against the others
    const byRate = (a, b) => b.rate_per_100k - a.rate_per_100k;
    const sorted = [...data.filter((d) => !d.series_break).sort(byRate), ...data.filter((d) => d.series_break).sort(byRate)];
    const s = svgIn(rankFig.box, sorted.length * 38 + 30, { t: 6, r: 60, b: 24, l: 50 }, `Ranked bar chart of rates, ${year}`);
    const x = d3.scaleLinear([0, RATE_MAX], [0, s.w]);
    const y = d3
      .scaleBand(
        sorted.map((d) => d.state),
        [0, s.h],
      )
      .padding(0.25);
    s.g.append("g").attr("class", "ax").attr("transform", `translate(0,${s.h})`).call(d3.axisBottom(x).ticks(5));
    s.g.append("g").attr("class", "ax").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();
    const bars = s.g
      .selectAll("rect")
      .data(sorted)
      .join("rect")
      .attr("y", (d) => y(d.state))
      .attr("height", y.bandwidth())
      .attr("width", (d) => x(d.rate_per_100k))
      .attr("fill", (d) => (d.series_break ? "#fff" : colour(d.rate_per_100k)))
      .attr("stroke", (d) => (d.state === selected ? C.acc : C.ink))
      .attr("stroke-width", (d) => (d.state === selected ? 5 : 2))
      .attr("stroke-dasharray", (d) => (d.series_break ? "6 4" : null))
      .attr("aria-label", (d) => `${d.state}: ${d.rate_per_100k.toFixed(0)} per 100,000`);
    tipOn(bars, tipHtml);
    s.g
      .selectAll(".v")
      .data(sorted)
      .join("text")
      .attr("x", (d) => x(d.rate_per_100k) + 8)
      .attr("y", (d) => y(d.state) + y.bandwidth() / 2 + 5)
      .attr("font-weight", 700)
      .text((d) => d.rate_per_100k.toFixed(0) + (d.series_break ? " *" : ""));
  }

  // ---------- 4) small multiples ----------
  function drawSparklines() {
    const width = sparkFig.box.clientWidth || 320;
    const columns = Math.max(2, Math.min(4, Math.floor(width / 170)));
    const cellW = width / columns,
      cellH = 110;
    const s = svgIn(
      sparkFig.box,
      Math.ceil(8 / columns) * cellH + 10,
      { t: 0, r: 0, b: 0, l: 0 },
      "Small multiples: rate over time for each state",
    );
    const x = d3.scaleLinear([2011, 2021], [8, cellW - 24]);
    const y = d3.scaleLinear([60, RATE_MAX], [cellH - 26, 18]);
    Object.keys(TILE_POS).forEach((state, i) => {
      const g = s.g.append("g").attr("transform", `translate(${(i % columns) * cellW},${Math.floor(i / columns) * cellH})`);
      const series = rows.filter((d) => d.state === state);
      const breakYear = series.find((d) => d.series_break)?.year; // the break happens once; only that segment is dashed
      g.append("text").attr("x", 8).attr("y", 12).attr("font-weight", 700).attr("font-size", 14).text(state);
      for (let j = 1; j < series.length; j++) {
        // one segment per year so series-break segments can be dashed
        g.append("line")
          .attr("x1", x(series[j - 1].year))
          .attr("y1", y(series[j - 1].rate_per_100k))
          .attr("x2", x(series[j].year))
          .attr("y2", y(series[j].rate_per_100k))
          .attr("stroke", state === selected ? C.acc : C.ink)
          .attr("stroke-width", 3)
          .attr("stroke-dasharray", series[j].year === breakYear ? "4 3" : null);
      }
      const current = series.find((d) => d.year === year);
      g.append("circle")
        .attr("cx", x(year))
        .attr("cy", y(current.rate_per_100k))
        .attr("r", 5)
        .attr("fill", C.acc)
        .attr("stroke", C.ink)
        .attr("stroke-width", 2);
      g.append("text")
        .attr("x", x(year))
        .attr("y", y(current.rate_per_100k) - 9)
        .attr("text-anchor", "middle")
        .attr("font-size", 13)
        .text(current.rate_per_100k.toFixed(0));
    });
  }

  // ---------- 5) remoteness lollipop (counts only) ----------
  function drawRemoteness() {
    const byArea = d3.rollup(
      D.remote.filter((d) => d.remoteness !== "Missing"),
      (v) => ({ a: v.find((d) => d.year === 2011)?.hospitalisations, b: v.find((d) => d.year === 2021)?.hospitalisations }),
      (d) => d.remoteness,
    );
    const data = ["Major Cities", "Regional", "Remote"].map((r) => ({
      r,
      ...byArea.get(r),
      p: (byArea.get(r).b / byArea.get(r).a - 1) * 100,
    }));
    const s = svgIn(
      remoteFig.box,
      215,
      { t: 10, r: 90, b: 30, l: Math.min(160, innerWidth * 0.36) },
      "Lollipop chart of percent change in hospitalisations by remoteness",
    );
    const x = d3.scaleLinear([Math.min(-10, d3.min(data, (d) => d.p) - 5), Math.max(30, d3.max(data, (d) => d.p) + 5)], [0, s.w]);
    const y = d3
      .scaleBand(
        data.map((d) => d.r),
        [0, s.h],
      )
      .padding(0.4);
    s.g
      .append("g")
      .attr("class", "ax")
      .attr("transform", `translate(0,${s.h})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(6)
          .tickFormat((d) => d + "%"),
      );
    s.g
      .append("line")
      .attr("x1", x(0))
      .attr("x2", x(0))
      .attr("y1", 0)
      .attr("y2", s.h)
      .attr("stroke", C.ink)
      .attr("stroke-width", 2); // zero line
    const row = s.g
      .selectAll("g.row")
      .data(data)
      .join("g")
      .attr("class", "row")
      .attr("transform", (d) => `translate(0,${y(d.r) + y.bandwidth() / 2})`);
    row
      .append("line")
      .attr("x1", x(0))
      .attr("x2", (d) => x(d.p))
      .attr("stroke", C.ink)
      .attr("stroke-width", 4);
    row
      .append("circle")
      .attr("cx", (d) => x(d.p))
      .attr("r", 9)
      .attr("fill", C.ink)
      .attr("stroke", C.ink)
      .attr("stroke-width", 3);
    row
      .append("text")
      .attr("x", -10)
      .attr("y", -2)
      .attr("text-anchor", "end")
      .attr("font-size", 15)
      .text((d) => d.r);
    row
      .append("text")
      .attr("x", -10)
      .attr("y", 16)
      .attr("text-anchor", "end")
      .attr("font-size", 13)
      .style("fill", "#4a4a63")
      .text((d) => `2021 rate: ${Math.round(REMOTE_RATE_2021[d.r])}`);
    row
      .append("text")
      .attr("x", (d) => x(d.p) + (d.p >= 0 ? 16 : -16))
      .attr("text-anchor", (d) => (d.p >= 0 ? "start" : "end"))
      .attr("y", 5)
      .attr("font-weight", 700)
      .text((d) => pct(d.p));
    tipOn(row, (d) => `<b>${d.r}</b><br>${fmt(d.a)} → ${fmt(d.b)} cases`);
    return data;
  }

  function draw() {
    const data = Object.keys(TILE_POS).map((state) => rowOf(state, year));
    drawMap(data);
    drawDrill();
    drawRanking(data);
    drawSparklines();
  }
  draw();
  const remoteData = drawRemoteness();
  addTable(
    remoteFig,
    ["Remoteness", "2011", "2021", "Change"],
    remoteData.map((d) => [d.r, fmt(d.a), fmt(d.b), pct(d.p)]),
  );
  onResize(() => {
    draw();
    drawRemoteness();
  });
}
