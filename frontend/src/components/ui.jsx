import { useEffect, useRef } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { addDays, clamp, cn, localDateKey, parseKey } from '../utils/format.js';

/* Static class maps (Tailwind needs full class names to be present in source) */
export const TONES = {
  violet: { grad: 'from-violet-500 to-indigo-600', soft: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300', text: 'text-violet-600 dark:text-violet-400', bar: 'bg-violet-500', hex: '#8b5cf6' },
  cyan: { grad: 'from-cyan-500 to-sky-600', soft: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300', text: 'text-cyan-600 dark:text-cyan-400', bar: 'bg-cyan-500', hex: '#06b6d4' },
  emerald: { grad: 'from-emerald-500 to-teal-600', soft: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', hex: '#10b981' },
  amber: { grad: 'from-amber-400 to-orange-500', soft: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500', hex: '#f59e0b' },
  rose: { grad: 'from-rose-500 to-pink-600', soft: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', text: 'text-rose-600 dark:text-rose-400', bar: 'bg-rose-500', hex: '#f43f5e' },
  slate: { grad: 'from-slate-500 to-slate-700', soft: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300', text: 'text-slate-600 dark:text-slate-400', bar: 'bg-slate-500', hex: '#64748b' },
};

export function Card({ className, hover = false, children, ...rest }) {
  return (
    <div className={cn('card', hover && 'card-hover', className)} {...rest}>
      {children}
    </div>
  );
}

export function PageHeader({ icon: Icon, title, subtitle, actions, tone = 'violet' }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg shadow-violet-500/20', TONES[tone].grad)}>
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'violet', trend, className }) {
  return (
    <Card hover className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1.5 truncate text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
          {trend !== undefined && trend !== null && (
            <p className={cn('mt-1 text-xs font-semibold', trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : trend < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400')}>
              {trend > 0 ? '▲' : trend < 0 ? '▼' : '•'} {Math.abs(trend)} vs last week
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', TONES[tone].grad)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  );
}

export function Badge({ tone = 'violet', children, className }) {
  return <span className={cn('badge', TONES[tone].soft, className)}>{children}</span>;
}

export function ProgressBar({ value, max = 100, tone = 'violet', className, height = 'h-2', label }) {
  const pct = max > 0 ? clamp((value / max) * 100, 0, 100) : 0;
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800', height, className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn('h-full rounded-full transition-all duration-500', TONES[tone].bar)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ProgressRing({ value, size = 96, stroke = 9, color = '#8b5cf6', track, children, className }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = clamp(value || 0, 0, 100);
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={track || 'stroke-slate-100 dark:stroke-slate-800'} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

export function Skeleton({ className }) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-slate-200/70 dark:bg-slate-800', className)}>
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/10" />
    </div>
  );
}

export function SkeletonGrid({ count = 4, className = 'h-28' }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700', className)}>
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{text}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function Spinner({ className }) {
  return <span className={cn('inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent', className)} aria-label="Loading" />;
}

export function Modal({ open, onClose, title, children, size = 'max-w-lg' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <div ref={ref} tabIndex={-1} className={cn('relative max-h-[92vh] w-full animate-pop overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl outline-none scroll-thin dark:bg-slate-900 sm:rounded-3xl', size)}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="icon-btn" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', danger = true }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="max-w-sm">
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button
          className={cn('btn', danger ? 'btn-danger' : 'btn-primary')}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function Segmented({ options, value, onChange, className, size = 'md' }) {
  return (
    <div className={cn('inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800', className)} role="tablist">
      {options.map((o) => {
        const opt = typeof o === 'object' ? o : { value: o, label: o };
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg font-semibold transition',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
              active ? 'bg-white text-violet-700 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            )}
          >
            {opt.icon && <opt.icon className="h-4 w-4" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, max = 100, step = 1, unit, decimals = 1 }) {
  const set = (v) => onChange(clamp(Math.round(v * 100) / 100, min, max));
  const shown = Number.isInteger(value) ? value : Number(value).toFixed(decimals);
  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
      <button type="button" onClick={() => set(value - step)} disabled={value <= min} className="icon-btn !h-8 !w-8 disabled:opacity-30" aria-label="Decrease">
        <Minus className="h-4 w-4" />
      </button>
      <div className="min-w-[3.5rem] flex-1 text-center text-sm font-bold text-slate-900 dark:text-white">
        {shown}
        {unit && <span className="ml-1 text-xs font-medium text-slate-400">{unit}</span>}
      </div>
      <button type="button" onClick={() => set(value + step)} disabled={value >= max} className="icon-btn !h-8 !w-8 disabled:opacity-30" aria-label="Increase">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

/** 1-5 picker shown as emoji or numbers. */
export function RatingPicker({ value, onChange, options, label }) {
  return (
    <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={label}>
      {options.map((o, i) => {
        const n = i + 1;
        const active = value === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} ${n} of 5`}
            title={o.label}
            onClick={() => onChange(n)}
            className={cn(
              'flex flex-col items-center rounded-xl border py-2 transition',
              active
                ? 'scale-105 border-violet-500 bg-violet-50 shadow-sm dark:border-violet-400 dark:bg-violet-500/15'
                : 'border-slate-200 bg-white hover:border-violet-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-violet-500'
            )}
          >
            <span className="text-xl leading-none">{o.icon}</span>
            <span className={cn('mt-1 text-[10px] font-semibold', active ? 'text-violet-700 dark:text-violet-300' : 'text-slate-400')}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export const MOOD = [
  { icon: '😞', label: 'Awful' }, { icon: '😕', label: 'Low' }, { icon: '😐', label: 'Okay' }, { icon: '🙂', label: 'Good' }, { icon: '😄', label: 'Great' },
];
export const STRESS = [
  { icon: '😌', label: 'Calm' }, { icon: '🙂', label: 'Mild' }, { icon: '😐', label: 'Some' }, { icon: '😟', label: 'High' }, { icon: '😫', label: 'Max' },
];
export const ENERGY = [
  { icon: '🪫', label: 'Drained' }, { icon: '😴', label: 'Low' }, { icon: '🙂', label: 'Okay' }, { icon: '⚡', label: 'High' }, { icon: '🚀', label: 'Peak' },
];
export const QUALITY = [
  { icon: '😖', label: 'Poor' }, { icon: '😕', label: 'Fair' }, { icon: '😐', label: 'Okay' }, { icon: '😊', label: 'Good' }, { icon: '🌟', label: 'Great' },
];

const HEAT = [
  'bg-slate-100 dark:bg-slate-800',
  'bg-violet-200 dark:bg-violet-900/70',
  'bg-violet-300 dark:bg-violet-700',
  'bg-violet-500 dark:bg-violet-500',
  'bg-violet-700 dark:bg-violet-300',
];

/** GitHub-style activity grid. `counts` is {YYYY-MM-DD: number}. */
export function Heatmap({ counts, days = 90, end = localDateKey() }) {
  const start = addDays(end, -(days - 1));
  const lead = parseKey(start).getDay(); // empty cells so columns align to weekdays
  const cells = [...Array.from({ length: lead }, () => null), ...Array.from({ length: days }, (_, i) => addDays(start, i))];
  const max = Math.max(1, ...Object.values(counts || {}));
  const level = (n) => (!n ? 0 : Math.min(4, Math.ceil((n / max) * 4)));
  return (
    <div className="overflow-x-auto pb-1 scroll-thin">
      <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
        {cells.map((key, i) =>
          key ? (
            <div key={key} title={`${key}: ${counts?.[key] || 0} activities`} className={cn('h-3.5 w-3.5 rounded-[4px] transition hover:scale-125', HEAT[level(counts?.[key])])} />
          ) : (
            <div key={`pad-${i}`} className="h-3.5 w-3.5" />
          )
        )}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-400">
        Less {HEAT.map((c, i) => <span key={i} className={cn('h-3 w-3 rounded-[3px]', c)} />)} More
      </div>
    </div>
  );
}

export function Sparkline({ values, color = '#8b5cf6', width = 96, height = 28 }) {
  const nums = values.map((v) => Number(v) || 0);
  const max = Math.max(...nums, 0.0001);
  const step = nums.length > 1 ? width / (nums.length - 1) : width;
  const pts = nums.map((v, i) => `${(i * step).toFixed(1)},${(height - 3 - (v / max) * (height - 6)).toFixed(1)}`);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {nums.length > 0 && <circle cx={(nums.length - 1) * step} cy={height - 3 - (nums[nums.length - 1] / max) * (height - 6)} r="2.5" fill={color} />}
    </svg>
  );
}
