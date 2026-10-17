import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Award,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Flame,
  ListChecks,
  LogOut,
  Mail,
  Sparkles,
  Target,
  Trophy,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';

const todayKey = () => new Date().toISOString().slice(0, 10);

function StatCard({ icon: Icon, label, value, sub, gradient }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl">
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-2xl transition group-hover:opacity-40`}
      />
      <span className={`inline-flex rounded-xl bg-gradient-to-br ${gradient} p-2.5 text-white shadow-md`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-600">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function ActionCard({ to, icon: Icon, title, desc, gradient }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}>
        <Icon className="h-6 w-6" />
      </span>
      <div className="flex-1">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500" />
    </Link>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { habits } = useApp();

  const stats = useMemo(() => {
    const today = todayKey();
    const bestStreak = Math.max(0, ...habits.map((h) => h.streak || 0));
    const loggedToday = habits.filter((h) => h.lastLogged === today).length;
    const studyHabits = habits.filter((h) => h.category === 'Study').length;
    const achieved = habits.filter((h) => h.target > 0 && (h.current || 0) >= h.target).length;
    const completeness = Math.min(
      100,
      Math.round(
        (user?.name ? 25 : 0) +
          (user?.email ? 25 : 0) +
          (habits.length > 0 ? 25 : 0) +
          (bestStreak > 0 ? 25 : 0)
      )
    );
    return { bestStreak, loggedToday, studyHabits, achieved, total: habits.length, completeness };
  }, [habits, user]);

  if (!user) return <Navigate to="/login" replace />;

  const initial = user.name?.[0]?.toUpperCase() || 'U';
  const firstName = user.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-600/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-cyan-500/30 blur-3xl" />

        <div className="relative flex flex-col gap-8 p-6 sm:p-10 md:flex-row md:items-center">
          {/* Avatar with gradient ring */}
          <div className="relative mx-auto shrink-0 md:mx-0">
            <div className="rounded-3xl bg-gradient-to-br from-indigo-400 via-violet-400 to-cyan-400 p-1 shadow-xl shadow-indigo-500/30">
              <div className="flex h-28 w-28 items-center justify-center rounded-[1.4rem] bg-slate-950 text-4xl font-extrabold">
                <span className="bg-gradient-to-br from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                  {initial}
                </span>
              </div>
            </div>
            <span className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-slate-950">
              <BadgeCheck className="h-4.5 w-4.5 text-white" />
            </span>
          </div>

          {/* Identity */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-sm font-medium text-indigo-200">
              {greeting}, {firstName} 👋
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{user.name}</h1>
            <p className="mt-1 flex items-center justify-center gap-2 text-sm text-slate-300 md:justify-start">
              <Mail className="h-4 w-4" /> {user.email}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/15">
                CSE Undergraduate
              </span>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                Active student
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 self-center rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-rose-500/20 hover:text-rose-200 md:self-start"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>

        {/* Profile completeness */}
        <div className="relative border-t border-white/10 bg-white/5 px-6 py-4 sm:px-10">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 font-medium text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Profile completeness
            </span>
            <span className="font-bold text-white">{stats.completeness}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 transition-all duration-700"
              style={{ width: `${stats.completeness}%` }}
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your progress</h2>
            <p className="text-sm text-slate-500">A snapshot of your habits and consistency.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={ListChecks} label="Total habits" value={stats.total} sub="Tracked in My Habits" gradient="from-indigo-500 to-violet-500" />
          <StatCard icon={Flame} label="Best streak" value={`${stats.bestStreak}d`} sub="Longest active run" gradient="from-orange-500 to-rose-500" />
          <StatCard icon={Target} label="Logged today" value={stats.loggedToday} sub={stats.loggedToday ? 'Keep it up!' : 'Nothing yet today'} gradient="from-emerald-500 to-teal-500" />
          <StatCard icon={Trophy} label="Targets reached" value={stats.achieved} sub={`Out of ${stats.total} habits`} gradient="from-amber-500 to-yellow-500" />
        </div>
      </section>

      {/* Account details */}
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Account details</h2>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">Verified email</span>
        </div>
        <div className="grid divide-y divide-slate-100 md:grid-cols-2 md:gap-x-8 md:divide-y-0">
          <div className="divide-y divide-slate-100">
            <InfoRow icon={User} label="Full name" value={user.name} />
            <InfoRow icon={Mail} label="Email" value={user.email} />
          </div>
          <div className="divide-y divide-slate-100">
            <InfoRow icon={BookOpen} label="Department" value="Computer Science & Engineering" />
            <InfoRow icon={CalendarDays} label="Account type" value="Student" />
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900">Quick actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <ActionCard
            to="/habits"
            icon={ListChecks}
            title="Manage habits"
            desc="Add, log and review your daily habits."
            gradient="from-indigo-500 to-violet-500"
          />
          <ActionCard
            to="/analytics"
            icon={Award}
            title="View analytics"
            desc="See trends, benchmarks and correlations."
            gradient="from-cyan-500 to-blue-500"
          />
        </div>
      </section>
    </div>
  );
}