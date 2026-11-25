# GenAI Declaration (copy into the Design Book appendix)

**Tool:** Claude (Anthropic), used in the claude.ai chat.

## What Claude helped with
- **Design:** proposed the 7-chapter story structure (question, headline fact, "so what", bridge to the next chapter); chart types per question; the colour system (colour-blind safe Okabe-Ito road-user colours, neutral greys for rates and sex, one violet accent); the pixel-art layout (vehicle strips, pixel road, END scene); accessibility design (data tables, direct labels, dashed/open shapes for withheld data and counting-rule changes); and the wording of captions, notes and limitations.
- **JavaScript:** wrote and revised the ES-module code (`config.js`, `data.js`, `utils.js`, `main.js`, `transitions.js`, `endscene.js`, `trail.js`, `js/charts/ch1` to `ch7`), including data loading, state handling, keyboard support (roving tabindex), tooltips and the HTML/CSS (`index.html`, `css/style.css`).
- **D3:** wrote the D3 v7 chart code: scales and axes, line, area and 100% stacked area, bar, dumbbell, lollipop, heatmap, population pyramid with year animation, a custom Sankey (plain D3, no d3-sankey), tile map with hatching, small multiples, linked highlighting, and transitions.

## What our team did
- Chose the topic and the BITRE, ABS and Road Trauma Australia data; cleaned, joined and exported all CSV files in KNIME.
- Wrote the prompts below, ran the site and gave Claude the corrections to make.
- Wrote the Design Book, wireframes, storyboard and usability evaluation (Claude did not write these).

## What Claude did NOT do
Claude did not build the KNIME workflow, run the usability test with participants, or write the Design Book.

## Summary of prompts
| # | What we asked (simple words) | What Claude produced |
|---|---|---|
| P1 | Check my KNIME CSV files and suggest a data story about hospitalised road-crash injuries. | Checked the files, proposed 7 chapters. |
| P2 | Build a 7-chapter scroll story with D3 v7, one JavaScript file per chart. | index.html, css/style.css, js/main.js, data.js, utils.js, js/charts/ch1 to ch7. |
| P3 | Make people want to keep scrolling (question, "so what" box, hook to next chapter). | Chapter text in js/config.js. |
| P4 | Use a pixel-art style with my 8 images and a vehicle driving past between chapters. | css/style.css, transitions.js, endscene.js. |
| P5 | Check the site against the rubric and fix everything. | Bug fixes, consistent colours, keyboard access, corrected claims, comments. |
| P6 | Add road deaths as a second dataset and check my cleaned CSV files. | Deaths chart in Chapter 1, data.js accepts the cleaned files. |
| P7 | Review story consistency and wording that goes beyond the data, then fix it. | Reworded claims, indexed deaths-vs-hospitalised chart, 2014 annotation, series-break warnings, direct labels. |
| P8 | Update the data sources after adding the Road Trauma Australia 2024 tables. | Updated source lines and added the Table 9 and Table 20 rates as text. |
| P9 | Draw a pixel road from a START point through every chart to the end. | js/trail.js and the trail styles in css/style.css. |
| P10 | Fix every inconsistency from the review and show no "n.p." in charts. | Edited ch1 to ch7, utils.js, config.js, data.js; wrote ACCESSIBILITY_AUDIT.md. |

## How the output was checked
- Claude compared every number quoted on the site with the CSV files and with Road Trauma Australia Tables 6, 9 and 20 (computed with Python), and corrected the claims that did not match (for example the motorcyclist share).
- Claude ran a smoke test that renders all seven chapters in a simulated browser (jsdom) without errors and found no "n.p." text in the chart output. This is not a real-browser test.
- Claude computed colour contrast ratios for the palette (ACCESSIBILITY_AUDIT.md).
- The team ran the site, compared the numbers with the KNIME outputs, and recorded accessibility and usability results in the Design Book (sections 4.1 and 4.2).

*Keep this file identical to the prompts you really used.*
