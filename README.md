# Beyond the Fatality Numbers: Who Is Being Hurt on Australia's Roads? (2011–2021)
COS30045 Data Visualisation Project. D3 v7 scroll story, 7 chapters, pixel style.

## Run locally
`python -m http.server 8000` then open http://localhost:8000 (ES modules and CSV loading need a server, not file://).

## Structure
index.html · css/style.css · js/{config,data,utils,transitions,endscene,main}.js · js/charts/ch1..ch7 · data/*.csv (KNIME exports) · assets/img/*.png (pixel art)

## Data
- BITRE Hospitalised Injury Data (AIHW National Hospital Morbidity Database), 2011–2021: https://www.bitre.gov.au/publications/ongoing/hospitalised-injury
- ABS population for rates (Chapter 5): National, state and territory population (cat. 3101.0), Table 4, ERP at 30 June (file 310104.xlsx, joined in KNIME, exported as data/state_year.csv).
- data/road_deaths_year.csv (columns `year,deaths`, 2011–2021): from Annual_Trauma_Report_Tables_2024.xlsx, sheet T4 (Road Safety Data Hub, Road Trauma Australia 2024, Sept 2025; source ARDD): https://datahub.roadsafety.gov.au/reporting/annual-trauma. Chapter 1 compares hospitalised cases and road deaths, both indexed to 2011 = 100 (cases +16%, deaths -12%). Add the xlsx to the KNIME workflow too. Note: the newer AIHW tables in that file revise some hospital counts slightly (2021: 39,112 in Table 6, verified, vs 39,505 in the Sept 2023 release); this site uses the Sept 2023 release required by the brief.

## Fact check (verified against the CSVs)
34,033 → 39,505 (+16%); 2017 = 39,339; Apr 2020 2,357 vs Apr 2019 3,488 (−32%); cyclists 5,391 → 8,163 (+51%); pedestrians 2,754 → 2,334 (−15%);
men 64–66% each year; ages 65–74 1,968 → 3,018 (+53%); 17–25 8,094 → 8,010; cyclists 40–64 +68%; 2021 rates NT 286, Qld 200; remoteness Major Cities +21%, Regional +9%, Remote −4%;
First Nations 1,167 → 2,220 (+90%), non-Indigenous 31,997 → 36,755 (+15%); deaths in care 88 (2020, partial) and 0 (2021, not available).

## Changes in this version (review against the rubric)
- Story: Chapter 1/2 messages corrected to "rose until 2017, then levelled off"; causal COVID claim hedged; recap table in Chapter 7; remoteness moved to Chapter 5; state × road-user data now used (click a state).
- Bugs fixed: NT rates above 300 overflowed Chapter 5 scales; Chapter 7 deaths chart stuck at 300px; Chapter 3 "Share" labels; mobile nav overflow; tile click was overridden by the tooltip handler.
- Accessibility: roving tabindex (one Tab stop per chart, arrow keys inside), Esc closes tooltip, keyboard select on map, table captions/scope.
- Colour: road-user hues only for road users; sex, First Nations and totals use neutral inks.
- Code: formatted, section comments, descriptive names, GenAI prompt log at the top of js/config.js.

## GenAI declaration
Written by Claude (Anthropic) from the team prompts and checked by the team. Plain-language declaration: GENAI_DECLARATION.md and top of js/config.js. Replace [team name]/[names]/GitHub link in index.html.


## Changes in v5 (consistency review)
- Ch1: new indexed chart (deaths -12% vs hospital cases +16%); "people" changed to "cases"; note on ratio definition and Victoria 2012 baseline.
- Ch2/Ch3/Ch4/Ch6: causal or over-strong wording removed (COVID, "least protection", older adults, First Nations 2014); Ch4 states counts are not risk.
- Ch3: stacked-area direct labels, new stack order; Ch4: "Show cyclists only" button, Sankey labels no longer overlap.
- Ch5: ranking marks series-break states with *; sparkline dashes only the break year; remoteness caveat (counts, not rates).
- Ch6: 2014 annotated on the line chart. Ch7: deaths-in-care chart removed, policy row replaced by exposure data.
- Bridge text uses the readable body font. Still to fill in by the team: team name, names/IDs and GitHub link in index.html.


## Changes in v6 (data sources)
- Source lines updated (index.html footer, Chapter 1 captions, Chapter 5 remoteness caption, data.js, README) to cite Road Safety Data Hub, Road Trauma Australia 2024 with the URL.
- Text now quotes two rates from the same workbook (not plotted, 2017-2021 only): Table 9 (ages 65-74: 128.8 to 122.6 per 100,000) and Table 20 (remoteness 2021: Remote 221.8, Regional 169.9, Major Cities 140.7). They come from a different release than the BITRE counts and are never mixed in a chart. Cite both tables in the Design Book data section.
- Not used: hospitalised data for 2022 (35,815) because the brief covers 2011-2021.

## Changes in v7 (pixel road)
- New js/trail.js + "Pixel road" block at the end of css/style.css: a road runs from the START sign through every chart card (gates STOP 1.1 ... 7.2) to the FINISH line. Scrolling drives a small car and lights the yellow centre line; current card gets an orange shadow.
- makeFig no longer sets inline margin (spacing now in CSS so the road has room between cards).

## Changes in v8 (rubric review)
- No "n.p." shown in charts: withheld counts appear as a dash, an open dashed bar ("at least") or an open marker; wording is "withheld".
- Story: Ch3/Ch7 corrected (only cyclists gained share; motorcyclists flat). Ch1 reduced to 2 charts (duplicate bars and ratio removed). Ch4 pyramid shows 2011 outline and a readout of the headline numbers. Ch5 ranking lists series-break states last (open bars); remoteness chart shows 2021 rates (Table 20) beside the count change. Ch7 limits updated (two releases).
- Colour: violet accent for selection and 2020; vermillion only for Pedal cyclist; rate map in greys.
- Accessibility: svg role=group, marks role=img with labels, chart text >= 12-13px; see ACCESSIBILITY_AUDIT.md.
