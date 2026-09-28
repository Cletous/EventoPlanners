import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  Server,
  ShieldCheck,
  TicketCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const features = [
  {
    icon: CalendarCheck2,
    title: 'Discover events',
    description: 'Browse published events and see the date, venue, fee and availability before registering.',
  },
  {
    icon: TicketCheck,
    title: 'Manage registrations',
    description: 'Keep your event registrations, statuses and eligible cancellations together in one attendee portal.',
  },
  {
    icon: CreditCard,
    title: 'Pay securely',
    description: 'Paid event registrations connect to Paynow while keeping payment status visible inside the application.',
  },
];

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const [health, setHealth] = useState({ tone: 'loading', text: 'Checking system connection...' });

  useEffect(() => {
    api.get('/health')
      .then((response) => {
        setHealth(
          response.data?.database === true
            ? { tone: 'success', text: 'Frontend, backend and database are connected.' }
            : { tone: 'warning', text: 'Backend connected, but the database health check failed.' },
        );
      })
      .catch((error) => {
        setHealth({
          tone: 'error',
          text: error.response?.data?.database === false
            ? 'Backend connected, but the database connection failed.'
            : 'Unable to connect to the backend.',
        });
      });
  }, []);

  if (!isLoading && user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  }

  const healthClasses = {
    loading: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    error: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  };

  return (
    <PublicLayout>
      <section className="mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
            <CheckCircle2 size={16} />
            Discover. Register. Attend.
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
            One place to move from discovering an event to showing up.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            EventoPlanners brings event discovery, registration and payment management into a single focused experience for attendees and administrators.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 dark:focus-visible:ring-indigo-500/30"
            >
              Create attendee account <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3.5 font-bold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500/40 dark:hover:text-indigo-300 dark:focus-visible:ring-indigo-500/20"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <Icon size={20} />
                </div>
                <h2 className="mt-4 text-sm font-extrabold text-slate-950 dark:text-white">{title}</h2>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-5 shadow-2xl shadow-slate-300/35 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/20 sm:p-7">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-500/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-100">EventoPlanners workspace</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">Event operations, without the clutter.</h2>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <LayoutDashboard size={22} />
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-indigo-100">
                Attendees get a focused portal while administrators manage events, registrations, payments and reporting from one system.
              </p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <Server className="text-indigo-600 dark:text-indigo-300" size={21} />
                <p className="mt-3 text-sm font-extrabold text-slate-950 dark:text-white">System health</p>
                <p className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold leading-5 ${healthClasses[health.tone]}`}>{health.text}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <ShieldCheck className="text-violet-600 dark:text-violet-300" size={21} />
                <p className="mt-3 text-sm font-extrabold text-slate-950 dark:text-white">Role-protected access</p>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Administrator and attendee routes are protected using the project&apos;s JWT authentication flow.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Built for a complete event lifecycle</p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <span className="rounded-lg bg-slate-50 px-2 py-2 dark:bg-slate-800">Discover</span>
                <span className="rounded-lg bg-slate-50 px-2 py-2 dark:bg-slate-800">Register</span>
                <span className="rounded-lg bg-slate-50 px-2 py-2 dark:bg-slate-800">Attend</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
