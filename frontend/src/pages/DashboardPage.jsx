import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileBarChart,
  Search,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  UserRound,
  Users,
  WalletCards,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(
    new Date(`${String(value).slice(0, 10)}T00:00:00`),
  );
}

function formatMoney(value) {
  return `US$${Number(value || 0).toFixed(2)}`;
}

function registrationStatusLabel(status) {
  if (status === 'pending_payment') return 'Pending payment';
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
}

function registrationStatusClass(status) {
  if (status === 'confirmed') return 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300';
  if (status === 'pending_payment') return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
}

function Surface({ children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none ${className}`}>
      {children}
    </section>
  );
}

function SummaryCard({ icon, label, value, note }) {
  return (
    <Surface className="group p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:hover:border-slate-700">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">{value}</p>
          {note && <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{note}</p>}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 transition group-hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20">
          {icon}
        </div>
      </div>
    </Surface>
  );
}

function BreakdownRow({ label, value, tone = 'neutral' }) {
  const tones = {
    success: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    danger: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{value}</span>
    </div>
  );
}

function SectionHeading({ title, description, actionTo, actionLabel }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-bold text-slate-950 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {actionTo && (
        <Link to={actionTo} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
          {actionLabel}<ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}

function LoadingPanel() {
  return (
    <Surface className="mt-6 flex min-h-56 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-500/20 dark:border-t-indigo-400" />
        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Loading dashboard...</p>
      </div>
    </Surface>
  );
}

function QuickAction({ to, icon, title, description }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/40"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-indigo-500/10 dark:group-hover:text-indigo-300">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-slate-900 dark:text-white">{title}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <ArrowRight size={17} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500 dark:text-slate-600" />
    </Link>
  );
}

export default function DashboardPage({ admin = false }) {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const endpoint = admin ? '/admin/dashboard' : '/user/dashboard';
        const response = await api.get(endpoint);
        if (active) setDashboard(response.data.dashboard);
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || 'Unable to load dashboard information.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();
    return () => { active = false; };
  }, [admin]);

  const adminEvents = dashboard?.events || {};
  const registrations = dashboard?.registrations || {};
  const payments = dashboard?.payments || {};

  return (
    <AppShell role={admin ? 'admin' : 'user'}>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-5 py-6 text-white shadow-lg shadow-indigo-900/10 sm:px-7 sm:py-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-violet-300/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] ring-1 ring-white/15">
                {admin ? <ShieldCheck size={14} /> : <UserRound size={14} />}
                {admin ? 'Administrator workspace' : 'Attendee workspace'}
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Welcome back, {user.name}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
                {admin
                  ? 'Monitor events, registrations, payments and reporting from one clear operational overview.'
                  : 'Keep track of your registrations, payment progress and upcoming event activity.'}
              </p>
            </div>
            <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 sm:flex">
              <Sparkles size={28} className="text-white" />
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? <LoadingPanel /> : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {admin ? (
                <>
                  <SummaryCard icon={<CalendarDays size={21} />} label="Total events" value={adminEvents.total || 0} note={`${adminEvents.upcoming || 0} upcoming published`} />
                  <SummaryCard icon={<Users size={21} />} label="Registrations" value={registrations.total || 0} note={`${registrations.confirmed || 0} confirmed`} />
                  <SummaryCard icon={<CreditCard size={21} />} label="Payment attempts" value={payments.total || 0} note={`${payments.pending || 0} currently pending`} />
                  <SummaryCard icon={<CircleDollarSign size={21} />} label="Successful payments" value={formatMoney(payments.paid_amount)} note={`${payments.paid || 0} paid attempts`} />
                </>
              ) : (
                <>
                  <SummaryCard icon={<TicketCheck size={21} />} label="My registrations" value={registrations.total || 0} note={`${registrations.confirmed || 0} confirmed`} />
                  <SummaryCard icon={<Clock3 size={21} />} label="Pending payment" value={registrations.pending_payment || 0} note="Registrations still awaiting payment" />
                  <SummaryCard icon={<WalletCards size={21} />} label="Payment attempts" value={payments.total || 0} note={`${payments.paid || 0} successful`} />
                  <SummaryCard icon={<CircleDollarSign size={21} />} label="Amount paid" value={formatMoney(payments.paid_amount)} note="Total successful payment value" />
                </>
              )}
            </div>

            {admin ? (
              <>
                <div className="grid gap-5 xl:grid-cols-3">
                  <Surface className="p-5">
                    <SectionHeading title="Event status" description="Current event catalogue breakdown." />
                    <div className="mt-5 space-y-2.5">
                      <BreakdownRow label="Published" value={adminEvents.published || 0} tone="success" />
                      <BreakdownRow label="Draft" value={adminEvents.draft || 0} tone="warning" />
                      <BreakdownRow label="Closed" value={adminEvents.closed || 0} />
                    </div>
                  </Surface>
                  <Surface className="p-5">
                    <SectionHeading title="Registration status" description="All attendee registrations." />
                    <div className="mt-5 space-y-2.5">
                      <BreakdownRow label="Confirmed" value={registrations.confirmed || 0} tone="success" />
                      <BreakdownRow label="Pending payment" value={registrations.pending_payment || 0} tone="warning" />
                      <BreakdownRow label="Cancelled" value={registrations.cancelled || 0} />
                    </div>
                  </Surface>
                  <Surface className="p-5">
                    <SectionHeading title="Payment status" description="All payment attempts recorded." />
                    <div className="mt-5 space-y-2.5">
                      <BreakdownRow label="Paid" value={payments.paid || 0} tone="success" />
                      <BreakdownRow label="Pending" value={payments.pending || 0} tone="warning" />
                      <BreakdownRow label="Failed" value={payments.failed || 0} tone="danger" />
                    </div>
                  </Surface>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                  <Surface className="p-5">
                    <SectionHeading title="Recent registrations" description="The five newest registrations." actionTo="/admin/registrations" actionLabel="View all" />
                    <div className="mt-5 space-y-3">
                      {(dashboard?.recent_registrations || []).length === 0 ? (
                        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">No registrations yet.</p>
                      ) : dashboard.recent_registrations.map((registration) => (
                        <div key={registration.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                          <div className="min-w-0"><p className="truncate font-semibold text-slate-900 dark:text-white">{registration.user_name}</p><p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{registration.event_title}</p><p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Registered {formatDate(registration.created_at)}</p></div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${registrationStatusClass(registration.status)}`}>{registrationStatusLabel(registration.status)}</span>
                        </div>
                      ))}
                    </div>
                  </Surface>

                  <Surface className="p-5">
                    <SectionHeading title="Upcoming published events" description="Nearest events still accepting registrations." actionTo="/admin/events" actionLabel="Manage" />
                    <div className="mt-5 space-y-3">
                      {(dashboard?.upcoming_events || []).length === 0 ? (
                        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">No upcoming published events.</p>
                      ) : dashboard.upcoming_events.map((event) => (
                        <div key={event.id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                          <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate font-semibold text-slate-900 dark:text-white">{event.title}</p><p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{event.venue}</p></div><span className="shrink-0 text-xs font-bold text-indigo-600 dark:text-indigo-400">{formatDate(event.event_date)}</span></div>
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{Number(event.registration_count || 0)} of {Number(event.capacity || 0)} places registered</p>
                        </div>
                      ))}
                    </div>
                  </Surface>
                </div>
              </>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                <Surface className="p-5">
                  <SectionHeading title="Upcoming confirmed events" description="Your next confirmed event registrations." actionTo="/user/registrations" actionLabel="View all" />
                  <div className="mt-5 space-y-3">
                    {(dashboard?.upcoming_registrations || []).length === 0 ? (
                      <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">You do not have an upcoming confirmed event yet.</p>
                    ) : dashboard.upcoming_registrations.map((registration) => (
                      <div key={registration.registration_id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                        <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate font-semibold text-slate-900 dark:text-white">{registration.title}</p><p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{registration.venue}</p></div><span className="shrink-0 text-xs font-bold text-indigo-600 dark:text-indigo-400">{formatDate(registration.event_date)}</span></div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Starts at {String(registration.start_time || '').slice(0, 5)}</p>
                      </div>
                    ))}
                  </div>
                </Surface>

                <Surface className="p-5">
                  <SectionHeading title="Needs your attention" description="Registrations that still need payment." actionTo="/user/registrations" actionLabel="Open payments" />
                  <div className="mt-5 space-y-3">
                    {(dashboard?.pending_registrations || []).length === 0 ? (
                      <p className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700 dark:bg-green-500/10 dark:text-green-300">No pending registration payments.</p>
                    ) : dashboard.pending_registrations.map((registration) => (
                      <div key={registration.registration_id} className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
                        <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate font-semibold text-slate-900 dark:text-white">{registration.title}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatDate(registration.event_date)}</p></div><span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">{formatMoney(registration.registration_fee)}</span></div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Latest payment: {registration.latest_payment_status || 'No attempt yet'}</p>
                      </div>
                    ))}
                  </div>
                </Surface>
              </div>
            )}
          </>
        )}

        <div>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-950 dark:text-white">Quick actions</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Jump straight to your most-used areas.</p>
            </div>
          </div>
          <div className={`grid gap-3 ${admin ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-2'}`}>
            {admin ? (
              <>
                <QuickAction to="/admin/events" icon={<CalendarDays size={20} />} title="Manage events" description="Create, publish and close events" />
                <QuickAction to="/admin/registrations" icon={<TicketCheck size={20} />} title="Registrations" description="Review attendee registrations" />
                <QuickAction to="/admin/payments" icon={<CircleDollarSign size={20} />} title="Payments" description="Review payment activity" />
                <QuickAction to="/admin/reports" icon={<FileBarChart size={20} />} title="Reports" description="Open operational reports" />
              </>
            ) : (
              <>
                <QuickAction to="/user/events" icon={<Search size={20} />} title="Browse events" description="Find published events to attend" />
                <QuickAction to="/user/registrations" icon={<TicketCheck size={20} />} title="My registrations" description="Track registrations and payments" />
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
