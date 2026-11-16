import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  error: { icon: AlertTriangle, bar: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
  info: { icon: Info, bar: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (type, title, message) => {
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-3), { id, type, title, message }]);
      setTimeout(() => dismiss(id), type === 'error' ? 6000 : 3200);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (title, message) => push('success', title, message),
      error: (title, message) => push('error', title, message),
      info: (title, message) => push('info', title, message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-4 z-[70] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => {
          const s = STYLES[t.type];
          const Icon = s.icon;
          return (
            <div key={t.id} className="pointer-events-auto relative flex animate-slide-in items-start gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 pl-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <span className={`absolute inset-y-0 left-0 w-1 ${s.bar}`} />
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.text}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.title}</p>
                {t.message && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.message}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="icon-btn !h-7 !w-7" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
