/* data.js | Loads the KNIME-exported CSVs. Empty cells become null (never 0).
   GenAI: AI-assisted (Claude, Anthropic). Written by Claude from the team's prompts, then checked by the team. Prompt summary: js/config.js. */
const readCsv = (name) => d3.csv(`data/${name}.csv`, d3.autoType);

export async function loadAll() {
  const names = [
    "national_year_summary",
    "national_monthly",
    "national_year_roaduser_share",
    "national_year_roaduser_age_sex",
    "national_year_remoteness",
    "state_year",
    "state_year_roaduser",
    "first_nations_year",
    "first_nations_age",
    "first_nations_roaduser",
  ];
  const [summary, monthly, share, agesex, remote, state, stateRU, fnYear, fnAge, fnRU] = await Promise.all(names.map(readCsv));

  // Normalise the First Nations files to {status, dim, year, n}
  const fnAgeN = fnAge.map((d) => ({
    status: d.status,
    dim: d.dimension,
    year: d.year,
    n: d.hospitalisations,
  }));
  const fnRUN = fnRU.map((d) => ({ status: d.status, dim: d.dimension, year: d.year, n: d.hospitalisations }));

  // OPTIONAL second dataset: road deaths per calendar year (columns: year, deaths), Road Safety Data Hub, Road Trauma Australia 2024, Table 4.
  // If the file is missing the "deaths vs hospitalised" chart is simply not drawn.
  const deaths = await readCsv("road_deaths_year")
    .then((r) => (r.length ? r : null))
    .catch(() => null);

  // Rates quoted in the text and the remoteness chart: AIHW tables 6, 9, 20 (Road Trauma Australia 2024), exported by KNIME.
  // Columns: source_table, measure, year, group, value. Missing file = text tokens fall back to "n/a" (never a made-up number).
  const trauma = await readCsv("road_trauma_rates").catch(() => []);

  return { trauma, summary, monthly, share, agesex, remote, state, stateRU, fnYear, fnAge: fnAgeN, fnRU: fnRUN, deaths };
}
