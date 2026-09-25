import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { user, isLoading, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/user/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="flex justify-center"><Logo compact /></div>
        <div className="mt-7 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Create your account</h1>
          <p className="mt-2 text-slate-500">Register as an EventoPlanners attendee.</p>
        </div>

        {error && <div className="mt-6 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-left"><span className="text-sm font-semibold text-slate-700">Full name</span><input required minLength={2} maxLength={100} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="Your full name" /></label>
          <label className="block text-left"><span className="text-sm font-semibold text-slate-700">Email address</span><input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="you@example.com" /></label>
          <label className="block text-left"><span className="text-sm font-semibold text-slate-700">Password</span><div className="relative mt-2"><input type={showPassword ? 'text' : 'password'} required minLength={8} maxLength={72} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="At least 8 characters" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 hover:text-slate-700" aria-label="Toggle password visibility">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label>
          <label className="block text-left"><span className="text-sm font-semibold text-slate-700">Confirm password</span><input type={showPassword ? 'text' : 'password'} required minLength={8} maxLength={72} autoComplete="new-password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="Repeat your password" /></label>
          <button disabled={submitting} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"><UserPlus size={18} /> {submitting ? 'Creating account...' : 'Create account'}</button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">Sign in</Link></p>
      </div>
    </main>
  );
}
