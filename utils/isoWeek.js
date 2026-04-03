/** ISO week [start, endExclusive) in UTC for the week containing `date`. */
function getISOWeekRangeUTC(date) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const toMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + toMonday));
  start.setUTCHours(0, 0, 0, 0);
  const endExclusive = new Date(start);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 7);
  return { start, endExclusive };
}

module.exports = { getISOWeekRangeUTC };
