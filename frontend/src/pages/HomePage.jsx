import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Server, ShieldCheck } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const [health, setHealth] = useState('Checking system connection...');

  useEffect(() => {
    api.get('/health')
      .then((response) => {
        setHealth(
          response.data?.database === true
            ? 'Frontend, Backend and Database are connected'
            : 'Backend connected but database health check failed',
        );
      })
      .catch((error) => {
        setHealth(
          error.response?.data?.database === false
            ? 'Backend connected but database connection failed'
            : 'Unable to connect to backend',
        );
      });
  }, []);

  if (!isLoading && user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <nav className="flex items-center justify-between gap-4">
          <Logo compact />
          <div className="flex items-center gap-3">
            <Link to="/login" className="rounded-xl px-4 py-2.5 font-semibold text-slate-700 hover:bg-white">
              Login
            </Link>
            <Link to="/register" className="rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-700">
              Create account
            </Link>
          </div>
        </nav>

        <section className="grid items-center gap-12 py-20 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
              <CheckCircle2 size={16} /> Discover. Register. Attend.
            </span>
            <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl">
              Event registration made simple.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              EventoPlanners gives attendees one place to discover events, register, and manage payments while administrators manage the event process.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-indigo-700">
                Get started <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm hover:border-indigo-200">
                Sign in
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60">
            <Logo />
            <div className="mt-7 space-y-4">
              <div className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
                <Server className="mt-0.5 text-indigo-600" size={22} />
                <div><p className="font-semibold">System health</p><p className="mt-1 text-sm text-slate-600">{health}</p></div>
              </div>
              <div className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
                <ShieldCheck className="mt-0.5 text-violet-600" size={22} />
                <div><p className="font-semibold">Secure role access</p><p className="mt-1 text-sm text-slate-600">Administrator and attendee areas are protected using JWT authentication.</p></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
