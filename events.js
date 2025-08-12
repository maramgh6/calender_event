// Weekly summary (every Tuesday) + daily "tomorrow" reminder
// Dates are formatted in English. Timezone: Asia/Amman

const TZ = 'Asia/Amman';

// === Configuration ===
const WEEKLY_DOW = 2; // 0=Sun, 1=Mon, 2=Tue, ... 6=Sat (send weekly summary on Tuesday)
// If your workflow runs more than once per day, optionally gate by hour:
// const WEEKLY_AFTER_HOUR = 0; // e.g., only send after 08:00; set to null to disable

// ===== Helpers =====
const toAmman = (d) =>
  new Date(new Date(d).toLocaleString('en-US', { timeZone: TZ }));

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const sameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();

const fmtEnglish = (d) =>
  toAmman(d).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  });

const fmtShortRange = (d) =>
  toAmman(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: TZ,
  });

// ===== Current time (Amman) =====
const now = toAmman(new Date());
const today = startOfDay(now);
const tomorrow = startOfDay(addDays(today, 1));
const todayDOW = now.getDay();

// ===== Read events from input items =====
const readEvent = (item) => {
  const name = item.json['Event'] ?? item.json['event'] ?? item.json['title'] ?? 'Event';
  const dateStr = item.json['Date'] ?? item.json['date'] ?? item.json['when'];
  if (!dateStr) return null;

  const raw = new Date(dateStr);
  if (isNaN(raw)) return null;

  const eventDate = startOfDay(toAmman(raw));
  return { name: String(name).trim(), date: eventDate };
};

const allEvents = items.map(readEvent).filter(Boolean);

// ===== Build outputs =====
const outputs = [];

// 1) Weekly summary every Tuesday: next 7 days (Sun-based weeks vary, so we use rolling 7 days)
if (todayDOW === WEEKLY_DOW /* && (WEEKLY_AFTER_HOUR == null || now.getHours() >= WEEKLY_AFTER_HOUR) */) {
  const weekStart = startOfDay(addDays(today, 1)); // start tomorrow
  const weekEnd = startOfDay(addDays(weekStart, 6)); // next 7 days window

  const inRange = (d) => d >= weekStart && d <= weekEnd;

  const weekEvents = allEvents
    .filter(e => inRange(e.date))
    .sort((a, b) => a.date - b.date || a.name.localeCompare(b.name, 'en'));

  const headerRange = `(${fmtShortRange(weekStart)} → ${fmtShortRange(weekEnd)})`;

  const body = weekEvents.length === 0
    ? 'No events scheduled for the coming week. Enjoy your time! ✨'
    : weekEvents.map(e => `• ${fmtEnglish(e.date)} — *${e.name}*`).join('\n');

  const weeklyMsg =
    `🗓️ *Weekly Summary* ${headerRange}\n\n` +
    `${body}`;

  outputs.push({
    json: {
      text: weeklyMsg,
      kind: 'weekly_summary',
      range_start: weekStart.toISOString().slice(0,10),
      range_end: weekEnd.toISOString().slice(0,10),
    }
  });
}

// 2) Daily reminder if there are events tomorrow
const tomorrowEvents = allEvents
  .filter(e => sameDay(e.date, tomorrow))
  .sort((a, b) => a.name.localeCompare(b.name, 'en'));

if (tomorrowEvents.length > 0) {
  const list = tomorrowEvents
    .map(e => `• *${e.name}*\n  🗓️ ${fmtEnglish(e.date)}`)
    .join('\n\n');

  const reminderMsg =
    `⏰ *Friendly Reminder*\n` +
    `These events are scheduled for *tomorrow*:\n\n${list}\n\n` +
    `Good luck! 🌟`;

  outputs.push({
    json: {
      text: reminderMsg,
      kind: 'reminder',
      date: tomorrow.toISOString().slice(0, 10),
    }
  });
}

// If nothing to send, return an empty array
return outputs.length ? outputs : [];
