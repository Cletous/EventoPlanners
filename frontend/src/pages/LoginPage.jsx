import { CheckCircle2, Eye, EyeOff, LoaderCircle, LogIn, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { AlertBanner } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const authenticatedUser = await login(form);
      const defaultDestination = authenticatedUser.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      const requestedDestination = location.state?.from;
      navigate(requestedDestination || defaultDestination, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to login. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout authPage>
      <section className="mx-auto grid min-h-[calc(100vh-76px)] max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-16">
        <aside className="hidden lg:block">
          <div className="max-w-md">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
              <ShieldCheck size={24} />
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">Welcome back to your event workspace.</h1>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
              Sign in to continue managing registrations, payments and event activity from the role-specific portal.
            </p>
            <div className="mt-8 space-y-3">
              {['Role-protected administrator and attendee areas', 'Persistent light and dark appearance preference', 'Direct return to the page you originally requested'].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={18} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="mx-auto w-full max-w-md rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-2xl shadow-slate-300/35 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/20 sm:p-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Secure access</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Sign in</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Enter your EventoPlanners account credentials.</p>
          </div>

          {error && <AlertBanner tone="error" className="mt-6">{error}</AlertBanner>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block text-left">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Email address</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/20"
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-left">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Password</span>
              <div className="relative mt-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/20"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-indigo-100 dark:hover:text-slate-200 dark:focus-visible:ring-indigo-500/20"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </label>

            <button
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-indigo-500/30"
            >
              {submitting ? <LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5 text-center dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No attendee account yet?{' '}
              <Link to="/register" className="font-bold text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
