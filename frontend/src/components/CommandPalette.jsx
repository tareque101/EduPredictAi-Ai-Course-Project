import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, Download, Moon, PlusCircle, Search, Sparkles, Timer } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { NAV_ITEMS } from '../layouts/nav.js';
import { openChat } from './ChatBot.jsx';
import { openQuickLog } from './QuickLog.jsx';
import { cn } from '../utils/format.js';

export const OPEN_PALETTE = 'edupredict:palette';

/** Ctrl/⌘+K launcher: jump to any page or run a common action. */
export default function CommandPalette() {
  const { user } = useAuth();
  const { toggle, dark } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);

  const commands = useMemo(() => {
    const go = (to) => () => navigate(to);
    const list = [];
    if (user) {
      list.push(
        { id: 'log', label: 'Log today (health, habits, skills, ECA)', icon: PlusCircle, run: () => openQuickLog('health'), words: 'check-in track add' },
        { id: 'focus', label: 'Start a focus session', icon: Timer, run: go('/tasks'), words: 'pomodoro timer study' },
        ...NAV_ITEMS.map((n) => ({ id: n.to, label: `Go to ${n.label}`, icon: n.icon, run: go(n.to), words: n.words || '' })),
        { id: 'export', label: 'Export my data', icon: Download, run: go('/profile'), words: 'download csv json backup' }
      );
    } else {
      list.push({ id: '/', label: 'Go to Home', icon: Sparkles, run: go('/'), words: '' }, { id: '/predict', label: 'Go to Predict CGPA', icon: Sparkles, run: go('/predict'), words: '' }, { id: '/login', label: 'Log in or sign up', icon: Sparkles, run: go('/login'), words: '' });
    }
    list.push(
      { id: 'chat', label: 'Ask EduBot', icon: Sparkles, run: () => openChat(), words: 'assistant help chatbot' },
      { id: 'theme', label: dark ? 'Switch to light mode' : 'Switch to dark mode', icon: Moon, run: toggle, words: 'theme appearance' }
    );
    return list;
  }, [user, navigate, toggle, dark]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? commands.filter((c) => `${c.label} ${c.words}`.toLowerCase().includes(q)) : commands;
  }, [commands, query]);

  useEffect(() => setIndex(0), [query, open]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') setOpen(false);
    };
    const onOpen = () => setOpen(true);
    document.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_PALETTE, onOpen);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_PALETTE, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const choose = (cmd) => {
    setOpen(false);
    cmd?.run();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg animate-pop overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-800">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, results.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
              if (e.key === 'Enter') { e.preventDefault(); choose(results[index]); }
            }}
            placeholder="Type a command or page…"
            className="h-14 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
            aria-label="Search commands"
          />
          <kbd className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:border-slate-700">ESC</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2 scroll-thin">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-400">No matches</li>}
          {results.map((c, i) => (
            <li key={c.id}>
              <button
                onMouseEnter={() => setIndex(i)}
                onClick={() => choose(c)}
                className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition', i === index ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200' : 'text-slate-600 dark:text-slate-300')}
              >
                <c.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{c.label}</span>
                {i === index && <CornerDownLeft className="h-3.5 w-3.5 opacity-60" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
