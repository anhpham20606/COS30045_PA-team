/* config.js | Constants, colour palette, chapter text and transition settings (single source of truth).

   =====================================================================
   GENAI DECLARATION (COS30045 requirement), written in plain language
   =====================================================================
   AI tool used      : Claude (Anthropic), in the claude.ai chat.
   What Claude did   : wrote and later fixed the website code (HTML, CSS and D3 JavaScript in this folder)
                       and suggested the story structure, chart types and wording.
   What the team did : chose the topic and data, cleaned and exported the CSV files in KNIME,
                       asked for changes, ran and checked the site, and checked the numbers against the data.
   Every file starts with a header comment saying it is AI-assisted and pointing to this declaration.

   SUMMARY OF PROMPTS (what we asked, in simple words)
     P1  "Check my KNIME CSV files and suggest a data story about hospitalised road-crash injuries."
         -> Claude checked the files and proposed 7 chapters.
     P2  "Build a 7-chapter scroll story website with D3 v7, one JavaScript file per chart, reading the CSV files."
         -> Claude wrote index.html, css/style.css, js/main.js, js/data.js, js/utils.js and js/charts/ch1..ch7.
     P3  "Make people want to keep scrolling: a question for each chapter, a 'so what' box, a hook to the next chapter."
         -> Claude wrote the chapter text in this file (CHAPTERS).
     P4  "Use a fun pixel-art style with my 8 pixel images and a vehicle that drives past between chapters."
         -> Claude wrote css/style.css, js/transitions.js and js/endscene.js.
     P5  "Check the site against the marking rubric and fix everything."
         -> Claude fixed bugs, made colours consistent, improved keyboard access, corrected claims
            (for example "rose until 2017, then levelled off"), and added comments.
     P6  "Add road deaths as a second dataset, and check my cleaned CSV files."
         -> Claude added the deaths chart in Chapter 1 and made data.js accept the cleaned files.
     P7  "Review the whole site for story consistency and wording that goes beyond the data, then fix it."
         -> Claude reworded claims (Chapters 1-7), added an indexed deaths-vs-hospitalised chart, a 2014 annotation,
            series-break warnings on the ranking, direct labels on the stacked area and removed the deaths-in-care chart.
     P8  "Update the data sources after adding the Road Trauma Australia 2024 tables."
         -> Claude updated source lines (footer, chart captions, README) and added the Table 9 and Table 20 rates as text.
     P9  "Draw a pixel road from a START point that runs through every chart to the end, so readers can follow the story along the road."
         -> Claude wrote js/trail.js (SVG road, numbered gates, scroll-driven car) and the trail styles at the end of css/style.css.
     P10 "Fix every inconsistency found in the review and show no n.p. label in charts."
         -> Claude edited ch1-ch7, utils.js, config.js, data.js and wrote ACCESSIBILITY_AUDIT.md.

     P11 "Review the website against the rubric, fix every error, and split the commits between the two team members by chart."
         -> Claude fixed the Chapter 3 share claim, the Chapter 6 road-user label, wording in Chapters 1, 2, 5, 7, added a from-2012 check
            for First Nations, moved the quoted AIHW rates into data/road_trauma_rates.csv (so KNIME holds all data), served D3 locally,
            and prepared the commits (feature/rubric-fixes branch).

   COLOUR RULES (one meaning per colour inside a chapter)
     - Road-user colours (colour-blind safe Okabe-Ito set) are used only for road users (Chapters 3, 4 Sankey, 5 drill-down).
     - Sex uses dark and light greys; First Nations vs non-Indigenous use dark ink vs slate (never road-user colours).
     - Totals (Chapters 1, 2, 5, 7) use dark ink. Violet (C.acc) is the one "look here" accent; orange-red (C.hi) belongs to Pedal cyclist only.
     - Rate maps and rankings use neutral greys, so no hue is reused with a second meaning. */

export const C = {
  ink: "#1B1B3A",
  hi: "#D55E00", // road-user colour for Pedal cyclist ONLY
  acc: "#5E35B1", // the one "look here" accent (selected state, 2020 line); never a road-user colour
  blue: "#0072B2",
  sky: "#56B4E9",
  green: "#009E73",
  yellow: "#F0E442",
  orange: "#E69F00",
  purple: "#CC79A7",
  grey: "#999999",
  light: "#C9C9DA",
  slate: "#6B7A8F",
};
export const SRC = "Source: BITRE Hospitalised Injury Data (AIHW National Hospital Morbidity Database), 2011–2021.";

// Road-user grouping used by every chart (the CSV files use slightly different names)
export const KEYS = [
  "Car occupant",
  "Motorcyclist",
  "Pedal cyclist",
  "Pedestrian",
  "Pick-up / van",
  "Heavy transport",
  "Bus occupant",
  "Other / unknown",
];
export const COL = {
  "Car occupant": C.blue,
  Motorcyclist: C.orange,
  "Pedal cyclist": C.hi,
  Pedestrian: C.green,
  "Pick-up / van": C.sky,
  "Heavy transport": C.purple,
  "Bus occupant": C.yellow,
  "Other / unknown": C.grey,
};
export const ICON = {
  "Car occupant": "car",
  "Pick-up / van": "suv",
  "Bus occupant": "bus",
  Motorcyclist: "scooter",
  "Pedal cyclist": "bicycle",
};
export const group = (n) =>
  /^Car/.test(n)
    ? "Car occupant"
    : /^Heavy/.test(n)
      ? "Heavy transport"
      : /^Pick-up/.test(n)
        ? "Pick-up / van"
        : /^Bus/.test(n)
          ? "Bus occupant"
          : ["Motorcyclist", "Pedal cyclist", "Pedestrian"].includes(n)
            ? n
            : "Other / unknown";

// Non-road-user categories get their own neutral colours so they never clash with COL
export const SEX_COL = { Female: C.light, Male: "#3B3B4F" };
export const GROUP_COL = { "First Nations people": C.ink, "Non-Indigenous": C.slate };

export const AGES = ["0-7", "8-16", "17-25", "26-39", "40-64", "65-74", "75+"];
export const STATES = ["NSW", "Vic", "Qld", "WA", "SA", "Tas", "ACT", "NT"];
export const FACING = { car: "r", suv: "l", bus: "r", scooter: "l", bicycle: "r" }; // direction each sprite faces

// One transition strip before each chapter: vehicle, direction (r/l), height, caption
export const TRANS = [
  { v: "car", d: "r", h: 230, cap: "Chapter 1: Is it getting worse?" },
  { v: "bus", d: "r", h: 250, cap: "Chapter 2: What did COVID change?" },
  { v: "scooter", d: "l", h: 220, cap: "Chapter 3: Who gets hurt?" },
  { v: "bicycle", d: "r", h: 220, cap: "Chapter 4: Which ages and sex?" },
  { v: "suv", d: "r", h: 240, cap: "Chapter 5: Where?" },
  { v: "car", d: "l", h: 230, cap: "Chapter 6: First Nations people" },
  { v: "bus", d: "r", h: 250, cap: "Chapter 7: How far can we trust this?", barrier: true },
];

// Story text. q = question, lead = headline fact, so = "so what", bridge = curiosity hook to next chapter.
// Every number below is checked against the CSV files (see README "Fact check").
export const CHAPTERS = [
  {
    q: "Is it getting worse?",
    lead: "Hospitalisations rose from 34,033 in 2011 to 39,505 in 2021 (+16%). Almost all of that rise came by 2017 (39,339). Since then the yearly count has levelled off. Over the same years road deaths fell about 12% (1,277 to 1,130).",
    so: "Road crashes put about 39,000 hospital cases on the books every year, while deaths fall. The rise slowed after 2017, but NSW changed its counting rules in 2017, so the plateau may partly be a counting effect, not safer roads. Victoria's 2012 change also means the rise since 2011 may be slightly understated.",
    bridge: "But 2020 looks odd. What happened when everyone stayed home?",
    note: "Counts of hospital cases, not people. Victoria (2012) and NSW (2017) changed counting rules, so later counts are not strictly comparable. Hospital cases exclude patients who died in hospital within 30 days; deaths are counted by year of crash and cases by year of discharge, so the two lines in the deaths comparison are aligned approximately, not exactly.",
  },
  {
    q: "What did COVID change?",
    lead: "April 2020 had 2,357 cases, 32% fewer than April 2019 (3,488). From June 2020 monthly cases were within about 3% of the same month in 2019 (above it in November and December), then dipped again from July to October 2021 (6% to 11% below 2019).",
    so: "Cases fell sharply in April 2020 and again from July to October 2021. These months coincide with COVID-19 restrictions, but this dataset holds no travel data, so it cannot show that less travel caused the dips.",
    bridge: "Whatever the cause, a total hides who is hurt. So who gets hurt?",
    note: "National monthly counts of hospital cases by month of discharge. The line chart axis starts at 2,000, not zero, to make the monthly pattern readable. COVID-19 restriction dates come from outside this dataset, so the story shows when cases fell, not why.",
  },
  {
    q: "Who gets hurt?",
    lead: "Cyclist hospitalisations rose 51% (5,391 to 8,163) while pedestrians fell 15% (2,754 to 2,334).",
    so: "Cyclists gained almost 5 points of share (15.8% to 20.7%); no other group gained more than 0.3 points. Motorcyclist counts rose 17% but their share stayed near 22%, pedestrians fell from 8.1% to 5.9%, and car occupants remain the largest group (about 47%). We cannot tell whether cycling became more dangerous or simply more popular.",
    bridge: "Cycling grew fastest. Is it the same for all ages, for men and for women?",
    note: "Counts only. There is no distance-travelled data by mode, so these are not risk rates.",
  },
  {
    q: "Which ages and which sex?",
    lead: "Men are about 65% of cases every year. Counts for ages 65–74 rose 53% (1,968 to 3,018) while ages 17–25 stayed flat (8,094 to 8,010). Cyclists aged 40–64 rose 68%.",
    so: "Counts did not grow among young adults; they grew among older adults and middle-aged cyclists. These are counts, not risk: Australia's population is ageing and the age groups differ in width, so we cannot say these groups became more at risk.",
    bridge: "That is the national picture. Does it look the same in every state?",
    note: "Counts, not rates. For 2017–2021, Road Trauma Australia 2024 (Table 9) shows the rate for ages 65–74 was flat to lower ({{age65_2017}} in 2017 to {{age65_2021}} in 2021 per 100,000; a different release, never mixed into a chart), so a rise in counts is not evidence of higher risk. Age groups have unequal widths (40–64 spans 25 years, 0–7 spans 8), so bars are not comparable across age groups. Unknown age and sex are left out of the charts but kept in totals.",
  },
  {
    q: "Where?",
    lead: "In 2021 the Northern Territory had 286 cases per 100,000 people and Queensland 200. By home area, counts grew 21% in Major Cities but fell 4% in Remote areas.",
    so: "Rates let us compare states of different sizes. Victoria and NSW (hatched) changed counting rules, so their levels are understated: do not rank them against other states or read their trends. The remoteness chart uses counts, so it does not show whether remote areas are safer: a different national release (Table 20) shows the 2021 rate is higher in Remote areas ({{remote_2021}} per 100,000) than in Major Cities ({{major_2021}}). Click a state to see who is hurt there.",
    bridge: "State averages hide communities with their own story. What do the counts show for First Nations people?",
    note: "Crude rates per 100,000 people, not age-standardised. The remoteness chart shows counts. The 2021 rates by remoteness (Remote {{remote_2021}}, Regional {{regional_2021}}, Major Cities {{major_2021}}) come from Road Trauma Australia 2024, Table 20 (AIHW), a different release from the BITRE data.",
  },
  {
    q: "What about First Nations people?",
    lead: "First Nations hospitalisations rose 90% (1,167 to 2,220), compared with 15% for non-Indigenous people. This compares counts only.",
    so: "Counts are growing faster, but our files have no First Nations population data, so we cannot say risk changed. Population growth and better recording of Indigenous status in hospital records may explain part of the rise. This is a gap in the data, not a conclusion about people.",
    bridge: "We found a lot of change. How far can we trust these numbers?",
    note: "Counts only, not a measure of risk. The by-road-user bars come from a separate source table whose totals differ slightly from the age and year totals, and small withheld counts appear as a dash (not zero). 2014 is understated because some small counts were withheld, so the 2014 dip is not a real fall; it is marked on the chart. A withheld count is not zero. About 1–3% of national cases are in neither line (cause not confirmed).",
  },
  {
    q: "How far can we trust this?",
    lead: "Here is what the story found, and five limits that matter. Open each card.",
    so: "The data describe what happened. They do not prove why, and they do not say what government should do.",
    bridge:
      "Hospitalised injuries are high and shifting toward cyclists. This story helps decision-makers see who and where, while being honest about data limits.",
    note: "Data are subject to revision by BITRE/AIHW.",
  },
];
