import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, BookOpen, Moon, Users } from 'lucide-react';

/* Deterministic pseudo-random generator so charts are stable across reloads. */
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);

const SEMESTER_TREND = Array.from({ length: 15 }, (_, i) => {
  const sleep = +(6.2 + Math.sin(i / 2) * 0.9 + (rand() - 0.5) * 0.6).toFixed(1);
  const cgpa = +(2.7 + (sleep - 6) * 0.18 + i * 0.03 + (rand() - 0.5) * 0.08).toFixed(2);
  return { week: `W${i + 1}`, sleep, cgpa };
});

const PEER_BENCHMARK = [
  { subject: 'Compiler Design', you: 3.5, cohort: 3.0, top10: 5.5 },
  { subject: 'Digital Signal Processing', you: 2.0, cohort: 2.8, top10: 4.5 },
  { subject: 'Thesis Work', you: 4.0, cohort: 3.6, top10: 6.5 },
  { subject: 'Mathematics', you: 1.5, cohort: 2.2, top10: 3.5 },
  { subject: 'Programming Lab', you: 3.0, cohort: 3.2, top10: 5.0 },
];

const ATTENDANCE_QUIZ = Array.from({ length: 40 }, () => {
  const attendance = Math.round(55 + rand() * 45);
  const quiz = Math.round(
    Math.min(100, Math.max(20, 35 + (attendance - 55) * 0.9 + (rand() - 0.5) * 18))
  );
  return { attendance, quiz };
});

/** Pearson correlation coefficient between two numeric keys of an array of objects. */
function pearson(points, xKey, yKey) {
  const n = points.length;
  if (n === 0) return 0;
  const mx = points.reduce((s, p) => s + p[xKey], 0) / n;
  const my = points.reduce((s, p) => s + p[yKey], 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (const p of points) {
    const a = p[xKey] - mx;
    const b = p[yKey] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}

function SummaryCard({ icon: Icon, label, value, hint, accent }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <span className={`rounded-xl p-2 ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export default function Analytics() {
  const avgSleep = useMemo(
    () => SEMESTER_TREND.reduce((s, d) => s + d.sleep, 0) / SEMESTER_TREND.length,
    []
  );
  const latestCgpa = SEMESTER_TREND[SEMESTER_TREND.length - 1].cgpa;

  const correlation = useMemo(() => pearson(ATTENDANCE_QUIZ, 'attendance', 'quiz'), []);
  const studyGap = useMemo(() => {
    const you = PEER_BENCHMARK.reduce((s, d) => s + d.you, 0) / PEER_BENCHMARK.length;
    const top = PEER_BENCHMARK.reduce((s, d) => s + d.top10, 0) / PEER_BENCHMARK.length;
    return (top - you).toFixed(1);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics Deep Dive</h1>
        <p className="text-sm text-slate-500">
          Explore how sleep, study, and attendance relate to your academic performance.
        </p>
      </div>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Activity}
          label="Latest CGPA"
          value={latestCgpa.toFixed(2)}
          hint="Week 15 snapshot"
          accent="bg-indigo-50 text-indigo-600"
        />
        <SummaryCard
          icon={Moon}
          label="Avg Sleep"
          value={`${avgSleep.toFixed(1)} hrs`}
          hint="Across 15 weeks"
          accent="bg-cyan-50 text-cyan-600"
        />
        <SummaryCard
          icon={Users}
          label="Attendance-Quiz r"
          value={correlation.toFixed(2)}
          hint={correlation > 0.5 ? 'Strong positive correlation' : 'Moderate correlation'}
          accent="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          icon={BookOpen}
          label="Study Gap to Top 10%"
          value={`${studyGap} hrs/day`}
          hint="Average difference across subjects"
          accent="bg-violet-50 text-violet-600"
        />
      </section>

      {/* Trend line chart */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Sleep vs. CGPA Trend</h2>
        <p className="mb-4 text-sm text-slate-500">Weekly sleep hours plotted against cumulative CGPA this semester.</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SEMESTER_TREND} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
              <YAxis yAxisId="left" stroke="#06b6d4" fontSize={12} domain={[4, 10]} label={{ value: 'Sleep (hrs)', angle: -90, position: 'insideLeft', fill: '#06b6d4', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#6366f1" fontSize={12} domain={[0, 4]} label={{ value: 'CGPA', angle: 90, position: 'insideRight', fill: '#6366f1', fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="sleep" name="Sleep (hrs)" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="cgpa" name="CGPA" stroke="#6366f1" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Peer benchmark bar chart */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Peer Benchmark: Study Hours</h2>
          <p className="mb-4 text-sm text-slate-500">Your weekly study hours compared with cohort average and top 10%.</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PEER_BENCHMARK} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="subject" stroke="#64748b" fontSize={11} interval={0} tick={{ width: 80 }} />
                <YAxis stroke="#64748b" fontSize={12} label={{ value: 'hrs / week', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="you" name="You" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cohort" name="Cohort Avg" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="top10" name="Top 10%" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Attendance vs quiz scatter plot */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Attendance vs. Quiz Scores</h2>
          <p className="mb-4 text-sm text-slate-500">
            Each point is one quiz session. Pearson r = {correlation.toFixed(2)}.
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" dataKey="attendance" name="Attendance" unit="%" domain={[50, 100]} stroke="#64748b" fontSize={12} />
                <YAxis type="number" dataKey="quiz" name="Quiz score" unit="%" domain={[0, 100]} stroke="#64748b" fontSize={12} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={ATTENDANCE_QUIZ} fill="#6366f1" fillOpacity={0.75} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}