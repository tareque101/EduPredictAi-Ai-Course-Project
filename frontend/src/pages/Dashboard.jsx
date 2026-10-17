import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Clock,
  Flame,
  GraduationCap,
  Lightbulb,
  Loader2,
  Moon,
  Play,
  Sparkles,
  Users,
} from 'lucide-react';
import { predictCgpa } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';

const DEFAULT_SIM = {
  studyHours: 3.5,
  sleepHours: 6.5,
  socialHours: 2.5,
  attendancePct: 88,
};

const CLASS_HOURS = 4;

const SLICE_COLORS = {
  Study: '#6366f1',
  Sleep: '#06b6d4',
  Social: '#f59e0b',
  Classes: '#10b981',
  Other: '#cbd5e1',
};

const RISK_STYLES = {
  Low: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  Moderate: 'bg-amber-100 text-amber-700 ring-amber-200',
  High: 'bg-rose-100 text-rose-700 ring-rose-200',
};

const SCENARIOS = [
  {
    key: 'sleep',
    label: 'Increase sleep to 7.5 hours',
    apply: (s) => ({ ...s, sleepHours: 7.5 }),
  },
  {
    key: 'study',
    label: 'Adding 1 hour of daily study',
    apply: (s) => ({ ...s, studyHours: Math.min(s.studyHours + 1, 12) }),
  },
  {
    key: 'attendance',
    label: 'Raising attendance by 10%',
    apply: (s) => ({ ...s, attendancePct: Math.min(s.attendancePct + 10, 100) }),
  },
  {
    key: 'social',
    label: 'Cutting social time by 1 hour',
    apply: (s) => ({ ...s, socialHours: Math.max(s.socialHours - 1, 0) }),
  },
];

function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`rounded-xl p-2 ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function SliderField({ label, unit, min, max, step, value, onChange, icon: Icon }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium text-slate-700">
          <Icon className="h-4 w-4 text-indigo-500" />
          {label}
        </span>
        <span className="font-semibold text-indigo-600">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-600"
      />
      <div className="mt-1 flex justify-between text-[11px] text-slate-400">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { habits, activity, cgpa, attendance, semester } = useApp();

  const [sim, setSim] = useState(DEFAULT_SIM);
  const [prediction, setPrediction] = useState(null);
  const [impacts, setImpacts] = useState([]);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState('');

  const runSimulation = useCallback(async (values) => {
    setSimLoading(true);
    setSimError('');
    try {
      const base = await predictCgpa(values);
      const scenarioResults = await Promise.all(
        SCENARIOS.map(async (scenario) => {
          const res = await predictCgpa(scenario.apply(values));
          return {
            key: scenario.key,
            label: scenario.label,
            delta: Math.round((res.predictedCgpa - base.predictedCgpa) * 100) / 100,
          };
        })
      );
      setPrediction(base);
      setImpacts(scenarioResults);
    } catch (err) {
      setSimError(
        'Cannot reach the ML API at port 5000. Start the Flask server and try again.'
      );
    } finally {
      setSimLoading(false);
    }
  }, []);

  // Debounced auto-run whenever a slider changes; also runs on mount.
  useEffect(() => {
    const timer = setTimeout(() => runSimulation(sim), 400);
    return () => clearTimeout(timer);
  }, [sim, runSimulation]);

  const setField = (field) => (value) => setSim((prev) => ({ ...prev, [field]: value }));

  const studyTotal = habits
    .filter((h) => h.category === 'Study')
    .reduce((sum, h) => sum + h.current, 0);
  const bestStreak = Math.max(0, ...habits.map((h) => h.streak));

  const totalHours = sim.studyHours + sim.sleepHours + sim.socialHours + CLASS_HOURS;
  const overAllocated = totalHours > 24;

  const allocation = useMemo(() => {
    const other = Math.max(0, 24 - totalHours);
    return [
      { name: 'Study', value: sim.studyHours },
      { name: 'Sleep', value: sim.sleepHours },
      { name: 'Social', value: sim.socialHours },
      { name: 'Classes', value: CLASS_HOURS },
      { name: 'Other', value: Math.round(other * 10) / 10 },
    ].filter((d) => d.value > 0);
  }, [sim, totalHours]);

  const bestImpact = impacts.reduce(
    (best, item) => (item.delta > (best?.delta ?? 0) ? item : best),
    null
  );

  let nudge;
  if (!prediction) {
    nudge = 'Adjust the sliders to generate personalised insights.';
  } else if (bestImpact && bestImpact.delta >= 0.01) {
    nudge = `${bestImpact.label} boosts your predicted CGPA by +${bestImpact.delta.toFixed(2)}.`;
  } else if (prediction.riskLevel === 'High') {
    nudge = 'Your current profile is high risk. Start with consistent sleep and attendance.';
  } else {
    nudge = 'Your habits are close to the model optimum. Keep your streaks alive.';
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, Student</h1>
          <p className="text-sm text-slate-500">
            {semester} overview. Here is how your habits are shaping your academic performance.
          </p>
        </div>
        <Link
          to="/analytics"
          className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          View deep-dive analytics <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* KPI hero */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={GraduationCap}
          label="Current CGPA"
          value={cgpa.toFixed(2)}
          sub="+0.08 vs last semester"
          accent="bg-indigo-50 text-indigo-600"
        />
        <KpiCard
          icon={CalendarCheck}
          label="Attendance"
          value={`${attendance}%`}
          sub="Target: 85% or higher"
          accent="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          icon={BookOpen}
          label="Avg Study Hours"
          value={`${studyTotal.toFixed(1)} hrs`}
          sub="Per day, across study habits"
          accent="bg-violet-50 text-violet-600"
        />
        <KpiCard
          icon={Flame}
          label="Logging Streak"
          value={`${bestStreak} Days`}
          sub="Longest active streak"
          accent="bg-orange-50 text-orange-600"
        />
      </section>

      {/* AI simulator + nudges */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Sparkles className="h-5 w-5 text-indigo-500" /> AI Performance Simulator
              </h2>
              <p className="text-sm text-slate-500">Adjust your habits to forecast your CGPA.</p>
            </div>
            <button
              onClick={() => runSimulation(sim)}
              disabled={simLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {simLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run Simulation
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <SliderField
              label="Daily Study"
              unit="hrs"
              min={0}
              max={12}
              step={0.5}
              value={sim.studyHours}
              onChange={setField('studyHours')}
              icon={BookOpen}
            />
            <SliderField
              label="Sleep"
              unit="hrs"
              min={3}
              max={10}
              step={0.5}
              value={sim.sleepHours}
              onChange={setField('sleepHours')}
              icon={Moon}
            />
            <SliderField
              label="Social Time"
              unit="hrs"
              min={0}
              max={8}
              step={0.5}
              value={sim.socialHours}
              onChange={setField('socialHours')}
              icon={Users}
            />
            <SliderField
              label="Attendance"
              unit="%"
              min={0}
              max={100}
              step={1}
              value={sim.attendancePct}
              onChange={setField('attendancePct')}
              icon={CalendarCheck}
            />
          </div>

          {simError && (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {simError}
            </div>
          )}

          {/* Large prediction display */}
          <div className="mt-6 flex flex-col items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 p-6 text-center text-white">
            <p className="text-sm font-medium uppercase tracking-wider text-indigo-100">Predicted CGPA</p>
            <p className="mt-2 text-6xl font-extrabold">
              {prediction ? prediction.predictedCgpa.toFixed(2) : '--'}
            </p>
            <div className="mt-3 flex items-center gap-2">
              {prediction && (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${RISK_STYLES[prediction.riskLevel]}`}
                >
                  {prediction.riskLevel} Risk
                </span>
              )}
              {prediction && (
                <span className="text-xs text-indigo-100">
                  Source: {prediction.source === 'model' ? 'ML model' : 'algorithmic fallback'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {/* AI nudge */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h3 className="flex items-center gap-2 text-base font-semibold text-amber-900">
              <Lightbulb className="h-5 w-5 text-amber-500" /> AI Nudge
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-amber-800">{nudge}</p>

            {impacts.length > 0 && (
              <ul className="mt-4 space-y-2">
                {impacts.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-700"
                  >
                    <span>{item.label}</span>
                    <span
                      className={`font-semibold ${
                        item.delta > 0 ? 'text-emerald-600' : item.delta < 0 ? 'text-rose-600' : 'text-slate-400'
                      }`}
                    >
                      {item.delta > 0 ? '+' : ''}
                      {item.delta.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Time allocation */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Clock className="h-5 w-5 text-indigo-500" /> 24-Hour Time Allocation
            </h3>
            <div className="mt-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocation}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {allocation.map((entry) => (
                      <Cell key={entry.name} fill={SLICE_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v} hrs`} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-slate-500">
              {overAllocated
                ? `Habits total ${totalHours.toFixed(1)} hrs. That exceeds 24 hours, so reduce a slider.`
                : `${totalHours.toFixed(1)} of 24 hours allocated.`}
            </p>
          </div>
        </div>
      </section>

      {/* Recent activity timeline */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-5 text-lg font-semibold text-slate-900">Recent Activity</h2>
        <ol className="relative ml-2 space-y-5 border-l border-slate-200">
          {activity.slice(0, 6).map((item) => (
            <li key={item.id} className="relative ml-6">
              <span
                className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full ring-4 ring-white ${item.dot}`}
              />
              <p className="text-sm font-medium text-slate-800">{item.text}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                {item.time}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}