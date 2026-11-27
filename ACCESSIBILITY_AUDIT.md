# Accessibility audit (copy into Design Book 4.1)
Contrast ratios computed with the WCAG 2.x formula. Graphical marks need >= 3:1 against the background (WCAG 1.4.11); text needs >= 4.5:1 (1.4.3).

| Colour | Hex | vs white | vs ink text | Graphics (>=3:1 on white) |
|---|---|---|---|---|
| Car occupant | #0072B2 | 5.2 | 3.2 | pass |
| Motorcyclist | #E69F00 | 2.3 | 7.4 | low: always outlined in ink |
| Pedal cyclist | #D55E00 | 3.9 | 4.3 | pass |
| Pedestrian | #009E73 | 3.4 | 4.9 | pass |
| Pick-up / van | #56B4E9 | 2.3 | 7.2 | low: always outlined in ink |
| Heavy transport | #CC79A7 | 3.1 | 5.4 | pass |
| Bus occupant | #F0E442 | 1.3 | 12.6 | low: always outlined in ink |
| Other / unknown | #999999 | 2.8 | 5.8 | low: always outlined in ink |
| Accent (violet) | #5E35B1 | 8.0 | 2.1 | pass |
| First Nations ink | #1B1B3A | 16.6 | 1.0 | pass |
| Non-Indigenous slate | #6B7A8F | 4.4 | 3.8 | pass |

Design measures: Okabe-Ito road-user palette (colour-blind safe); every mark also has an ink outline, direct labels or dash patterns, so colour is never the only cue; series-break and withheld data use dashed/open shapes; chart text 12-15 px; one Tab stop per chart with arrow-key movement; Esc closes tooltips; every chart has a text data table; reduced-motion respected.

## Still to run and record (results not available to the writer)
| Test | Tool | Result (team fills in) |
|---|---|---|
| Automated page audit | Lighthouse accessibility score | |
| Rule violations | axe DevTools / WAVE | |
| Colour-blind simulation (deuteranopia, protanopia) | Chrome DevTools > Rendering | |
| Keyboard-only walk-through of all 7 chapters | Manual | |
| Screen reader pass (Ch1, Ch5) | NVDA or VoiceOver | |
| 200% zoom and 360 px width | Browser | |
