import { addDays, localDateKey, parseKey } from './format.js';

const CATEGORIES = ['Study', 'Skill', 'ECA', 'Health', 'Personal'];
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * Turn one line of text into a task.
 *
 *   "Finish report !high #study tomorrow ~1h30m"
 *
 *   !high !med !low (or !1 !2 !3)   priority
 *   #study #skill #eca #health #personal   category (prefix is enough: #stu)
 *   today, tomorrow, mon..sun, +3d, 2026-12-01   due date
 *   ~45m, ~2h, ~1h30m   time estimate
 */
export function parseQuickAdd(input, today = localDateKey()) {
  const result = { title: '', priority: 2, category: 'Study', due_date: null, estimate_min: null };
  const words = [];

  for (const token of input.trim().split(/\s+/).filter(Boolean)) {
    const t = token.toLowerCase();
    let m;

    if ((m = t.match(/^!(high|h|3)$/))) result.priority = 3;
    else if ((m = t.match(/^!(med|medium|m|2)$/))) result.priority = 2;
    else if ((m = t.match(/^!(low|l|1)$/))) result.priority = 1;
    else if (t.startsWith('#') && t.length > 1) {
      const cat = CATEGORIES.find((c) => c.toLowerCase().startsWith(t.slice(1)));
      if (cat) result.category = cat;
      else words.push(token);
    } else if (t === 'today' || t === 'tod') result.due_date = today;
    else if (t === 'tomorrow' || t === 'tmr' || t === 'tom') result.due_date = addDays(today, 1);
    else if ((m = t.match(/^\+(\d{1,3})d$/))) result.due_date = addDays(today, Number(m[1]));
    else if ((m = t.match(/^(\d{4}-\d{2}-\d{2})$/)) && !Number.isNaN(parseKey(m[1]).getTime())) result.due_date = m[1];
    else if (WEEKDAYS.includes(t.slice(0, 3)) && t.length <= 9 && /^(sun|mon|tue|wed|thu|fri|sat)(day|sday|nesday|rsday|urday|s)?$/.test(t)) {
      const target = WEEKDAYS.indexOf(t.slice(0, 3));
      const current = parseKey(today).getDay();
      result.due_date = addDays(today, ((target - current + 7) % 7) || 7);
    } else if ((m = t.match(/^~(?:(\d+)h)?(?:(\d+)m?)?$/)) && (m[1] || m[2])) {
      const minutes = Number(m[1] || 0) * 60 + Number(m[2] || 0);
      if (minutes > 0) result.estimate_min = Math.min(minutes, 1440);
    } else words.push(token);
  }

  result.title = words.join(' ');
  return result;
}
