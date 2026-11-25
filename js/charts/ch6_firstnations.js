/* ch6_firstnations.js | Chapter 6: indexed lines (First Nations vs non-Indigenous) + grouped bars by age / road user.
   Counts only, never risk. "withheld" = not published (open markers / label, never zero).
   Colours: dark ink = First Nations, slate = non-Indigenous (never road-user hues).
   GenAI: AI-assisted (Claude, Anthropic). Written by Claude from the team's prompts, then checked by the team. Prompt summary: js/config.js. */
import { C, GROUP_COL } from "../config.js";
import { fmt, pct, makeFig, addTable, svgIn, tipOn, segmented, onResize } from "../utils.js";

// [data key, short label, colour]
const GROUPS = [
  ["First Nations people", "First Nations", GROUP_COL["First Nations people"]],
  ["Non-Indigenous", "Non-Indigenous", GROUP_COL["Non-Indigenous"]],
];

export function render(el, D) {
  let view = "age"; // 'age' or 'ru' (road user)
  const lineFig = makeFig(el, {
    title: "First Nations counts rose 90%, others 15%",
    sub: "Hospitalisations indexed to 2011 = 100 (counts, not risk). Open circle = some small counts withheld, so 2014 is understated",
  });
  const barFig = makeFig(el, {
    title: "Change 2011 to 2021 by group",
    sub: "Percent change in counts, First Nations vs non-Indigenous (counts only; small numbers can swing a lot)",
  });
  segmented(
    barFig.ctl,
    [
      ["age", "By age group"],
      ["ru", "By road user"],
    ],
    view,
    (v) => {
      view = v;
      draw();
    },
    "Breakdown",
  );
  addTable(
    barFig,
    ["Group", "Status", "Year", "Cases"],
    D.fnAge
      .filter((d) => d.year === 2011 || d.year === 2021)
      .map((d) => [d.dim, d.status, d.year, d.n == null ? "withheld" : fmt(d.n)]),
  );
  addTable(
    lineFig,
    ["Year", "Group", "Cases", "Half-years withheld"],
    D.fnYear.map((d) => [d.year, d.status, fmt(d.hospitalisations), d.np_halfyears]),
  );

  const base2011 = Object.fromEntries(
    GROUPS.map(([k]) => [k, D.fnYear.find((d) => d.status === k && d.year === 2011).hospitalisations]),
  );

  function draw() {
    // ---- indexed lines ----
    const s = svgIn(
      lineFig.box,
      360,
      { t: 24, r: 130, b: 34, l: 56 },
      "Line chart of indexed hospitalisations for First Nations and non-Indigenous people",
    );
    const index = (d) => (d.hospitalisations / base2011[d.status]) * 100;
    const x = d3.scaleLinear([2011, 2021], [0, s.w]);
    const y = d3.scaleLinear([80, d3.max(D.fnYear, index) + 10], [s.h, 0]);
    s.g
      .append("g")
      .attr("class", "ax")
      .attr("transform", `translate(0,${s.h})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(Math.min(11, Math.floor(s.w / 55)))
          .tickFormat(d3.format("d")),
      );
    s.g.append("g").attr("class", "ax").call(d3.axisLeft(y).ticks(6));
    s.g
      .append("line")
      .attr("x1", 0)
      .attr("x2", s.w)
      .attr("y1", y(100))
      .attr("y2", y(100))
      .attr("stroke", "#6b6b85")
      .attr("stroke-dasharray", "4 4"); // 2011 baseline

    // Annotation: years with n.p. half-years (2014) are understated, so the 2014 dip is not a real fall
    const npYears = [...new Set(D.fnYear.filter((d) => d.np_halfyears > 0).map((d) => d.year))];
    npYears.forEach((yr) => {
      s.g.append("line").attr("x1", x(yr)).attr("x2", x(yr)).attr("y1", 14).attr("y2", s.h).attr("stroke", C.ink).attr("stroke-dasharray", "3 4");
      s.g.append("text").attr("x", x(yr) + 6).attr("y", 10).attr("font-size", 13)
        .text(`${yr}: understated`);
    });

    GROUPS.forEach(([key, label, colour], gi) => {
      const series = D.fnYear.filter((d) => d.status === key);
      s.g
        .append("path")
        .datum(series)
        .attr("fill", "none")
        .attr("stroke", colour)
        .attr("stroke-width", gi === 0 ? 5 : 3)
        .attr(
          "d",
          d3
            .line()
            .x((d) => x(d.year))
            .y((d) => y(index(d))),
        );
      const dots = s.g
        .selectAll(".dot" + gi)
        .data(series)
        .join("circle")
        .attr("cx", (d) => x(d.year))
        .attr("cy", (d) => y(index(d)))
        .attr("r", 6)
        .attr("fill", (d) => (d.np_halfyears > 0 ? "#fff" : colour))
        .attr("stroke", colour)
        .attr("stroke-width", 3)
        .attr("aria-label", (d) => `${label} ${d.year}: ${fmt(d.hospitalisations)}`);
      tipOn(
        dots,
        (d) =>
          `<b>${label} ${d.year}</b><br>${fmt(d.hospitalisations)} cases (index ${index(d).toFixed(0)})` +
          (d.np_halfyears > 0 ? "<br>Some small counts withheld" : ""),
      );
      const last = series[series.length - 1];
      s.g
        .append("text")
        .attr("x", x(2021) + 10)
        .attr("y", y(index(last)) + 5)
        .attr("font-weight", 700)
        .attr("font-size", 14)
        .text(`${label} ${pct(index(last) - 100)}`);
    });

    // ---- grouped bars: % change 2011 -> 2021 for BOTH groups (comparable without population data) ----
    const data = view === "age" ? D.fnAge : D.fnRU;
    const dims = [...new Set(data.map((d) => d.dim))];
    const shortName = (d) =>
      d.replace(/, passenger or unknown position| or unknown position/, "").replace("Car driver", "Car occupant");
    const margin = { t: 30, r: 80, b: 10, l: Math.min(170, innerWidth * 0.34) };
    const b = svgIn(
      barFig.box,
      dims.length * 62 + 50,
      margin,
      "Grouped bar chart of percent change in hospitalisations 2011 to 2021, First Nations vs non-Indigenous people",
    );
    const countOf = (status, dim, yr) => data.find((d) => d.status === status && d.dim === dim && d.year === yr)?.n;
    const points = dims.flatMap((dim) =>
      GROUPS.map(([key, label, colour]) => {
        const from = countOf(key, dim, 2011),
          to = countOf(key, dim, 2021);
        return { dim, key, label, colour, from, to, p: from > 0 && to != null ? (to / from - 1) * 100 : null }; // null = n.p.
      }),
    );
    const extent = d3.extent(
      points.filter((d) => d.p != null),
      (d) => d.p,
    );
    const xb = d3.scaleLinear([Math.min(-20, extent[0] - 10), Math.max(40, extent[1] + 25)], [0, b.w]);
    const yDim = d3.scaleBand(dims, [0, b.h]).padding(0.25);
    const yGroup = d3
      .scaleBand(
        GROUPS.map((g) => g[0]),
        [0, yDim.bandwidth()],
      )
      .padding(0.1);
    b.g
      .append("g")
      .attr("class", "ax")
      .call(
        d3
          .axisTop(xb)
          .ticks(5)
          .tickFormat((d) => d + "%"),
      );
    b.g
      .append("line")
      .attr("x1", xb(0))
      .attr("x2", xb(0))
      .attr("y1", 0)
      .attr("y2", b.h)
      .attr("stroke", C.ink)
      .attr("stroke-width", 2);
    b.g
      .selectAll(".lb")
      .data(dims)
      .join("text")
      .attr("x", -8)
      .attr("y", (d) => yDim(d) + yDim.bandwidth() / 2 + 5)
      .attr("text-anchor", "end")
      .attr("font-size", 14)
      .text(shortName);

    const bars = b.g
      .selectAll(".br")
      .data(points)
      .join("g")
      .attr("transform", (d) => `translate(0,${yDim(d.dim) + yGroup(d.key)})`);
    bars
      .append("rect")
      .attr("x", (d) => (d.p == null ? xb(0) : Math.min(xb(0), xb(d.p))))
      .attr("height", yGroup.bandwidth())
      .attr("width", (d) => (d.p == null ? 0 : Math.abs(xb(d.p) - xb(0))))
      .attr("fill", (d) => d.colour)
      .attr("stroke", C.ink)
      .attr("stroke-width", 2);
    bars
      .append("text")
      .attr("x", (d) => (d.p == null ? xb(0) + 6 : d.p >= 0 ? xb(d.p) + 6 : xb(d.p) - 6))
      .attr("text-anchor", (d) => (d.p != null && d.p < 0 ? "end" : "start"))
      .attr("y", yGroup.bandwidth() / 2 + 4)
      .attr("font-size", 13)
      .text((d) => (d.p == null ? "–" : pct(d.p)));
    tipOn(
      bars,
      (d) =>
        `<b>${d.label}, ${shortName(d.dim)}</b><br>${d.from == null ? "withheld" : fmt(d.from)} → ${d.to == null ? "withheld" : fmt(d.to)} cases` +
        (d.p == null ? "<br>Count withheld (small numbers), not zero" : `<br>${pct(d.p)}`),
    );

    // legend (chips) above the grouped bars
    barFig.f.select(".leg").remove();
    const legend = barFig.f.insert("div", ".box").attr("class", "chips leg");
    GROUPS.forEach(([, label, colour]) =>
      legend.append("span").attr("class", "chip").html(`<i style="background:${colour}"></i>${label}`),
    );
  }
  draw();
  onResize(draw);
}
