/* ch7_limitations.js | Chapter 7: recap table (links back to each question), five limitation cards (native <details>)
   and a "where to look next" table.
   GenAI: AI-assisted (Claude, Anthropic). Written by Claude from the team's prompts, then checked by the team. Prompt summary: js/config.js. */
// What the story found, one row per chapter (numbers verified against the CSV files)
const RECAP = [
  ["1", "Is it getting worse?", "Up 16% since 2011, but almost all of the rise came by 2017. Flat since."],
  ["2", "What did COVID change?", "April 2020 was 32% below April 2019; lower again Jul–Oct 2021."],
  ["3", "Who gets hurt?", "Cyclists +51% (share 16% to 21%), motorcyclists +17% (share flat), pedestrians −15%."],
  ["4", "Which ages and sex?", "About 65% men. Counts: ages 65–74 +53%, ages 17–25 flat, cyclists 40–64 +68% (counts, not risk)."],
  ["5", "Where?", "NT 286 and Qld 200 cases per 100,000 in 2021. Major Cities +21%, Remote −4% (counts)."],
  ["6", "First Nations people?", "Counts +90% vs +15%, but no population data, so risk is unknown. 2014 is understated."],
];
const CARDS = [
  [
    "Counts, not rates",
    "Most charts show counts. States with larger populations have more cases, so only Chapter 5 uses rates (per 100,000), and those are crude.",
  ],
  [
    "Series breaks",
    "Victoria (from 2012) and NSW (from 2017) changed what counts as an admission. A fall in those states is not evidence of safer roads, and the flat national line after 2017 may partly be a counting effect.",
  ],
  [
    "Withheld small numbers",
    "Small numbers are suppressed in First Nations and state-by-road-user tables. They are missing, not zero, and are shown as open markers, open bars or a dash (Chapters 5 and 6).",
  ],
  [
    "Two data releases",
    "The charts use the BITRE September 2023 release. The newer AIHW tables (Road Trauma Australia 2024) revise totals slightly (2021: 39,112 vs 39,505). They supply only the road deaths in Chapter 1 and the rates quoted in Chapters 4 and 5, and are never mixed into one count. Hospital cases here exclude patients who died in hospital within 30 days.",
  ],
  [
    "Crude rates and no exposure data",
    "Rates are not age-standardised and we have no distance-travelled data by mode. We cannot say whether cycling became more dangerous or just more popular.",
  ],
];
const NEXT = [
  ["Exposure data by mode (distance travelled, bike counts)", "Cyclist cases +51%, but more cycling or more danger? Unknown"],
  ["Population data for First Nations people", "Rates cannot be calculated, so real risk is unknown"],
  ["Consistent definitions across states", "Series breaks make Victoria and NSW non-comparable"],
  ["Age-standardised rates", "Current rates are crude"],
  ["Aligned data releases", "BITRE (2023) and AIHW (2025) totals differ slightly"],
  ["Research on why counts rose", "More cycling, or more danger? Unknown"],
];

export function render(el, D) {
  const wrap = d3.select(el);

  // ---- recap: ties the story back to the questions asked in each chapter ----
  wrap.append("div").attr("class", "card").html(`<h3>What the story found</h3><p class="sub">One line per chapter.</p>
    <div class="tbl"><table><tr><th scope="col">Chapter</th><th scope="col">Question</th><th scope="col">Answer</th></tr>${RECAP.map(
      (r) => `<tr><td><a href="#ch${r[0]}">${r[0]}</a></td><td>${r[1]}</td><td>${r[2]}</td></tr>`,
    ).join("")}</table></div>`);

  // ---- limitation cards (first one open) ----
  const cards = wrap
    .selectAll("details.limit")
    .data(CARDS)
    .join("details")
    .attr("class", "card limit")
    .property("open", (d, i) => i === 0);
  cards.append("summary").html((d, i) => `<img class="px" src="assets/img/traffic_cone.png" alt=""> ${i + 1}. ${d[0]}`);
  cards.append("p").text((d) => d[1]);

  wrap.append("div").attr("class", "card")
    .html(`<h3>What the data suggest we look at next</h3><p class="sub">Not “what government must do”: the data describe, they do not prove causes.</p>
    <div class="tbl"><table><tr><th scope="col">Where to look</th><th scope="col">Why (from this data)</th></tr>${NEXT.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</table></div>`);
}
