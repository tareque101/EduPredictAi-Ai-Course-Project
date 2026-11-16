/** Small pure helpers used across pages. */

export const cn = (...parts) => parts.filter(Boolean).join(' ');

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export const avg = (arr) => {
  const v = arr.filter((n) => n !== null && n !== undefined && !Number.isNaN(n));
  return v.length ? v.reduce((s, n) => s + n, 0) / v.length : null;
};

/** Local calendar date as YYYY-MM-DD (not UTC, so late-night logs land on the right day). */
export const localDateKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const parseKey = (key) => new Date(`${key}T00:00:00`);

export const addDays = (key, n) => {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return localDateKey(d);
};

export const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);

export const shortDate = (key) =>
  parseKey(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export const longDate = (key) =>
  parseKey(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export const weekdayShort = (key) => parseKey(key).toLocaleDateString(undefined, { weekday: 'short' });

/** "Today", "Yesterday", "3d ago", "in 2d" */
export function relativeDay(key, today = localDateKey()) {
  const diff = daysBetween(today, key);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  return diff < 0 ? `${-diff}d ago` : `in ${diff}d`;
}

export const greeting = (hour = new Date().getHours()) =>
  hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

export const round1 = (n) => Math.round(n * 10) / 10;

export const fmtHours = (h) => {
  if (h === null || h === undefined) return '-';
  if (h < 1 && h > 0) return `${Math.round(h * 60)} min`;
  return `${round1(h)} h`;
};

export const fmtMinutes = (m) => {
  if (!m) return '0 min';
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? (r ? `${h}h ${r}m` : `${h}h`) : `${r}m`;
};

export const initialsOf = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || 'U';
