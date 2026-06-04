const { toDate } = require('date-fns-tz');
const timeZone = 'Asia/Tokyo';
const now = new Date();
const formatter = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
const parts = formatter.formatToParts(now);
const year = parts.find(p => p.type === 'year').value;
const month = parts.find(p => p.type === 'month').value;
const localStartStr = `${year}-${month}-01T00:00:00`;
console.log(toDate(localStartStr, { timeZone }).toISOString());
