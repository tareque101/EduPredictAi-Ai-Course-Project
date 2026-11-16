import { cn } from '../utils/format.js';

const RISK = {
  Low: ['#10b981', 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300', 'On track'],
  Moderate: ['#f59e0b', 'text-amber-600 bg-amber-50 dark:bg-amber-500/15 dark:text-amber-300', 'Watch closely'],
  High: ['#f43f5e', 'text-rose-600 bg-rose-50 dark:bg-rose-500/15 dark:text-rose-300', 'Needs attention'],
};

/** Half-circle gauge for a 0-4 CGPA. */
export default function CgpaGauge({ value, risk, size = 240 }) {
  const [color, badge, label] = RISK[risk] || ['#8b5cf6', 'text-slate-600 bg-slate-100', ''];
  const r = 90;
  const arc = Math.PI * r;
  const pct = Math.max(0, Math.min(1, (value || 0) / 4));
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.58} viewBox="0 0 220 125" role="img" aria-label={`Predicted CGPA ${value ?? 'unknown'} out of 4`}>
        <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" strokeWidth="16" strokeLinecap="round" className="stroke-slate-100 dark:stroke-slate-800" />
        <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" strokeDasharray={arc} strokeDashoffset={arc * (1 - pct)} style={{ transition: 'stroke-dashoffset .7s ease, stroke .3s' }} />
        <text x="110" y="100" textAnchor="middle" className="fill-slate-900 text-[38px] font-extrabold dark:fill-white">{value !== null && value !== undefined ? value.toFixed(2) : '–'}</text>
        <text x="110" y="120" textAnchor="middle" className="fill-slate-400 text-[11px] font-semibold">out of 4.00</text>
      </svg>
      {risk && <span className={cn('badge mt-1 !px-3 !py-1 text-sm', badge)}>{risk} risk · {label}</span>}
    </div>
  );
}
