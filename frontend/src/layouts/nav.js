import {
  BarChart3, CheckSquare, HeartPulse, LayoutDashboard, ListChecks, Repeat, Sparkles, Trophy, Users, Dumbbell,
} from 'lucide-react';

/** Single source of truth for navigation (sidebar, command palette). */
export const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, words: 'home summary' },
      { to: '/analytics', label: 'Analytics', icon: BarChart3, words: 'charts insights trends' },
    ],
  },
  {
    title: 'Track',
    items: [
      { to: '/tracker', label: 'Daily Tracker', icon: ListChecks, words: 'check-in log today' },
      { to: '/tasks', label: 'Planner', icon: CheckSquare, words: 'tasks todo focus pomodoro kanban' },
      { to: '/habits', label: 'Habits', icon: Repeat, words: 'streak routine' },
      { to: '/skills', label: 'Skills', icon: Dumbbell, words: 'practice learn level' },
      { to: '/activities', label: 'Activities', icon: Users, words: 'eca clubs volunteering' },
      { to: '/health', label: 'Health', icon: HeartPulse, words: 'sleep mood stress water' },
    ],
  },
  {
    title: 'Grow',
    items: [
      { to: '/predict', label: 'Predict CGPA', icon: Sparkles, words: 'ml grade forecast' },
      { to: '/profile', label: 'Profile & Badges', icon: Trophy, words: 'achievements xp level account settings' },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
