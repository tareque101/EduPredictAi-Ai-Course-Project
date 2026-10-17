import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Award,
  Bell,
  BookOpen,
  GraduationCap,
  HeartPulse,
  House,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Plus,
  TrendingUp,
} from 'lucide-react';
import ChatBot from '../components/ChatBot.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/habits', label: 'Habits', icon: ListChecks },
  { to: '/activities', label: 'ECA', icon: Award },
  { to: '/skills', label: 'Skills', icon: BookOpen },
  { to: '/health', label: 'Health', icon: HeartPulse },
  { to: '/analytics', label: 'Analytics', icon: TrendingUp },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, text: 'Your sleep average dropped below 7 hours this week.' },
  { id: 2, text: 'Compiler Design revision streak reached 9 days.' },
  { id: 3, text: 'Attendance report for October is ready.' },
];

export default function MainLayout() {
  const { habits, logHabit } = useApp();
  const { user, logout } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const [unread, setUnread] = useState(MOCK_NOTIFICATIONS.length);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    setShowQuickLog(false);
    setUnread(0);
  };

  const toggleQuickLog = () => {
    setShowQuickLog((prev) => !prev);
    setShowNotifications(false);
  };

  const initial = user?.name?.[0]?.toUpperCase() || 'G';

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="sticky top-0 z-40 border-b border-violet-100 bg-white/95 shadow-[0_1px_0_rgba(124,58,237,0.04)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 text-white shadow-md shadow-violet-500/25">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="hidden whitespace-nowrap text-base font-extrabold tracking-tight text-slate-900 2xl:block">
              EduPredict<span className="text-violet-600"> AI</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={label}
                className={({ isActive }) =>
                  `group relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-slate-500 hover:bg-violet-50/60 hover:text-violet-700'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-violet-600' : 'text-slate-400 group-hover:text-violet-500'}`} />
                    <span className="hidden xl:inline">{label}</span>
                    {isActive && (
                      <span className="absolute -bottom-[13px] left-3 right-3 h-0.5 rounded-full bg-violet-600" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right-side actions */}
          <div className="flex shrink-0 items-center gap-2.5">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={toggleNotifications}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-violet-100 bg-white text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {unread}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-xl shadow-violet-500/10">
                  <p className="border-b border-violet-50 px-4 py-3 text-sm font-semibold text-slate-900">Notifications</p>
                  <ul className="divide-y divide-violet-50">
                    {MOCK_NOTIFICATIONS.map((n) => (
                      <li key={n.id} className="px-4 py-3 text-sm text-slate-600">
                        {n.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Log Today */}
            {user && (
              <div className="relative">
                <button
                  onClick={toggleQuickLog}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:shadow-lg hover:shadow-violet-500/35"
                >
                  <Plus className="h-4 w-4" />
                  <span>Log Today</span>
                </button>
                {showQuickLog && (
                  <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-xl shadow-violet-500/10">
                    <p className="border-b border-violet-50 px-4 py-3 text-sm font-semibold text-slate-900">Quick log for today</p>
                    <ul className="max-h-72 divide-y divide-violet-50 overflow-y-auto">
                      {habits.length === 0 && (
                        <li className="px-4 py-3 text-sm text-slate-500">No habits yet. Add one in Habits.</li>
                      )}
                      {habits.map((h) => (
                        <li key={h.id} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-sm text-slate-700">{h.name}</span>
                          <button
                            onClick={() => logHabit(h.id)}
                            className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                          >
                            +{h.step} {h.unit}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Auth area */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  title="View profile"
                  className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 transition hover:bg-violet-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-500 text-sm font-bold text-white ring-2 ring-violet-100">
                    {initial}
                  </div>
                  <div className="hidden text-left xl:block">
                    <p className="whitespace-nowrap text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="whitespace-nowrap text-xs text-slate-500">{user.email}</p>
                  </div>
                </Link>
                <button
                  onClick={logout}
                  title="Log out"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-100 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                >
                  Log in
                </Link>
                <Link
                  to="/login"
                  state={{ mode: 'register' }}
                  className="whitespace-nowrap rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:shadow-lg"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className={isHome ? '' : 'mx-auto max-w-7xl px-4 py-8 md:px-6'}>
        <Outlet />
      </main>

      <ChatBot />
    </div>
  );
}