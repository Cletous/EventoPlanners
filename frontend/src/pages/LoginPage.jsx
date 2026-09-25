import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
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
    <main className="min-h-screen bg-slate-50 px-5 py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="flex justify-center"><Logo compact /></div>
        <div className="mt-7 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Welcome back</h1>
          <p className="mt-2 text-slate-500">Sign in to your EventoPlanners account.</p>
        </div>

        {error && <div className="mt-6 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <label className="block text-left">
            <span className="text-sm font-semibold text-slate-700">Email address</span>
            <input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="you@example.com" />
          </label>
          <label className="block text-left">
            <span className="text-sm font-semibold text-slate-700">Password</span>
            <div className="relative mt-2">
              <input type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="Enter your password" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 hover:text-slate-700" aria-label="Toggle password visibility">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
            </div>
          </label>
          <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
            <LogIn size={18} /> {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">No attendee account yet? <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">Create one</Link></p>
        <p className="mt-3 text-center"><Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-800">Back to home</Link></p>
      </div>
    </main>
  );
}
