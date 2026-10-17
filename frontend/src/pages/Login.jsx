import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const EMPTY = { name: '', email: '', password: '' };
const INPUT =
  'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const from = location.state?.from?.pathname || '/dashboard';
  const isLogin = mode === 'login';

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Cannot reach the server. Check that the backend is running.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <div className="flex flex-col items-center text-center">
          <span className="rounded-xl bg-indigo-600 p-3 text-white">
            <GraduationCap className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isLogin ? 'Log in to see your predictions and habits.' : 'Track habits and predict your CGPA.'}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-md py-2 ${isLogin ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`rounded-md py-2 ${!isLogin ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!isLogin && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
              <input name="name" value={form.name} onChange={handleChange} required className={INPUT} />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Gmail, Yahoo or university email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className={INPUT}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              className={INPUT}
            />
          </div>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLogin ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}