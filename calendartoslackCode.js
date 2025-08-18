/***** Weekly Events → Flat List but Sorted by Country (normalized) *****/

const WEEK_MODE = 'next';
const CONTEXT_URL = "https://docs.google.com/spreadsheets/d/1FNeJ62HPOa-cYqvij4RHRT75QKFJaB9a2lb8sad08jI/edit?usp=sharing";

const FLAGS = {
  "KSA":"🇸🇦","SAUDI ARABIA":"🇸🇦",
  "UAE":"🇦🇪","UNITED ARAB EMIRATES":"🇦🇪",
  "BH":"🇧🇭","BAHRAIN":"🇧🇭",
  "KW":"🇰🇼","KUWAIT":"🇰🇼",
  "QA":"🇶🇦","QATAR":"🇶🇦",
  "OM":"🇴🇲","OMAN":"🇴🇲",
  "GCC":"🌍"
};

function normalizeCountry(c){
  if (!c) return "GCC";
  const v = String(c).trim().toUpperCase();
  if (["UNIVERSAL","ALL","GLOBAL","GCC"].includes(v)) return "GCC";
  return v;
}

const HEADERS = {
  country: ['📍 Country','Country'],
  event:   ['🎉 Event','Event'],
  start:   ['📅 Start Date','Start Date','StartDate','From','Begin'],
  end:     ['📅 End Date','End Date','EndDate','To','Finish'],
};

function pick(obj, opts){ for (const k of opts) if (k in obj) return k; return null; }
function onlyDate(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function parseDate(v){
  if (!v) return null;
  if (typeof v === 'number') {
    const base = new Date(Date.UTC(1899,11,30));
    return onlyDate(new Date(base.getTime() + v*86400*1000));
  }
  const d = new Date(v);
  return isNaN(d) ? null : onlyDate(d);
}
function fmt(d){ return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); }
function startOfSundayWeek(d){ const t=onlyDate(d); const s=new Date(t); s.setDate(t.getDate()-t.getDay()); return s; }
function flagOf(c){ return FLAGS[c] || "🌍"; }

const now = new Date();
let weekStart = startOfSundayWeek(now);
if (WEEK_MODE === 'next') weekStart.setDate(weekStart.getDate()+7);
const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate()+6);

const rows = items.map(i=>i.json);
const probe = rows[0] || {};
const COL = {
  country: pick(probe, HEADERS.country),
  event:   pick(probe, HEADERS.event),
  start:   pick(probe, HEADERS.start),
  end:     pick(probe, HEADERS.end),
};

const events = [];
for (const r of rows){
  const s = parseDate(COL.start ? r[COL.start] : null);
  if (!s) continue;
  const e = parseDate(COL.end ? r[COL.end] : null) || s;
  if (!(s <= weekEnd && e >= weekStart)) continue;

  const country = normalizeCountry(r[COL.country]);
  events.push({
    s, e,
    country,
    title: r[COL.event] || ''
  });
}

// Sort by normalized Country then by Start Date
events.sort((a,b) => {
  const cc = a.country.localeCompare(b.country);
  if (cc !== 0) return cc;
  return a.s - b.s;
});

let text = `*[Weekly Events ${fmt(weekStart)} → ${fmt(weekEnd)}]*  <${CONTEXT_URL}|check context>\n\n`;

for (const ev of events){
  const range = `${fmt(ev.s)}${ev.e.getTime()!==ev.s.getTime()?` → ${fmt(ev.e)}`:''}`;
  text += `${flagOf(ev.country)} *${range}* | ${ev.title}\n`;
}

return [{ json: { text } }];
