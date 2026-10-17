import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  GraduationCap,
  House,
  LayoutDashboard,
  ListChecks,
  Plus,
  TrendingUp,
} from 'lucide-react';
import ChatBot from '../components/ChatBot.jsx';
import { SEMESTERS, useApp } from '../context/AppContext.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/habits', label: 'My Habits', icon: ListChecks },
  { to: '/analytics', label: 'Analytics', icon: TrendingUp },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, text: 'Your sleep average dropped below 7 hours this week.' },
  { id: 2, text: 'Compiler Design revision streak reached 9 days.' },
  { id: 3, text: 'Attendance report for October is ready.' },
];

export default function MainLayout() {
  const { semester, setSemester, habits, logHabit } = useApp();
  const [unread, setUnread] = useState(MOCK_NOTIFICATIONS.length);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [showSemesterMenu, setShowSemesterMenu] = useState(false);

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    setShowQuickLog(false);
    setShowSemesterMenu(false);
    setUnread(0);
  };

  const toggleQuickLog = () => {
    setShowQuickLog((prev) => !prev);
    setShowNotifications(false);
    setShowSemesterMenu(false);
  };

  const toggleSemesterMenu = () => {
    setShowSemesterMenu((prev) => !prev);
    setShowNotifications(false);
    setShowQuickLog(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          {/* Brand + navigation */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="rounded-xl bg-indigo-600 p-2 text-white">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="hidden text-lg font-bold text-slate-900 sm:block">EduPredict AI</span>
            </Link>
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Semester selector */}
            <div className="relative">
              <button
                onClick={toggleSemesterMenu}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                aria-haspopup="listbox"
                aria-expanded={showSemesterMenu}
              >
                <CalendarDays className="h-4 w-4 text-indigo-500" />
                <span className="hidden sm:inline">{semester}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
              {showSemesterMenu && (
                <ul className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  {SEMESTERS.map((s) => (
                    <li key={s}>
                      <button
                        onClick={() => {
                          setSemester(s);
                          setShowSemesterMenu(false);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {s}
                        {s === semester && <Check className="h-4 w-4 text-indigo-600" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={toggleNotifications}
                className="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
                    Notifications
                  </p>
                  <ul className="divide-y divide-slate-100">
                    {MOCK_NOTIFICATIONS.map((n) => (
                      <li key={n.id} className="px-4 py-3 text-sm text-slate-600">
                        {n.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Log Today quick action */}
            <div className="relative">
              <button
                onClick={toggleQuickLog}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Log Today</span>
              </button>
              {showQuickLog && (
                <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
                    Quick log for today
                  </p>
                  <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                    {habits.length === 0 && (
                      <li className="px-4 py-3 text-sm text-slate-500">No habits yet. Add one in My Habits.</li>
                    )}
                    {habits.map((h) => (
                      <li key={h.id} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-sm text-slate-700">{h.name}</span>
                        <button
                          onClick={() => logHabit(h.id)}
                          className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                        >
                          +{h.step} {h.unit}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Profile avatar */}
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-sm font-bold text-white">
                S
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-semibold text-slate-900">Student</p>
                <p className="text-xs text-slate-500">CSE Undergraduate</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <Outlet />
      </main>

      <ChatBot />
    </div>
  );
}