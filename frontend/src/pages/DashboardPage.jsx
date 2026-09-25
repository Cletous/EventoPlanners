import {
  CalendarDays,
  CircleDollarSign,
  Clock3,
  CreditCard,
  LogOut,
  Search,
  ShieldCheck,
  TicketCheck,
  UserRound,
  Users,
  WalletCards,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
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
  if (status === 'confirmed') return 'bg-green-50 text-green-700';
  if (status === 'pending_payment') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

function SummaryCard({ icon, label, value, note }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
          {note && <p className="mt-2 text-xs leading-5 text-slate-500">{note}</p>}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({ label, value, className = 'bg-slate-100 text-slate-700' }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${className}`}>{value}</span>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="mt-8 flex min-h-48 items-center justify-center rounded-3xl border border-slate-200 bg-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
    </div>
  );
}

export default function DashboardPage({ admin = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
        if (active) {
          setError(requestError.response?.data?.message || 'Unable to load dashboard information.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();
    return () => { active = false; };
  }, [admin]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const adminEvents = dashboard?.events || {};
  const registrations = dashboard?.registrations || {};
  const payments = dashboard?.payments || {};

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Logo compact />
          <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><LogOut size={17} /> Logout</button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              {admin ? <ShieldCheck size={24} /> : <UserRound size={24} />}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">Welcome, {user.name}</h1>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-violet-700">{user.role}</span>
            </div>
            <p className="mt-2 text-slate-500">
              {admin
                ? 'A live overview of EventoPlanners events, registrations and payment activity.'
                : 'A live overview of your registrations, payments and upcoming confirmed events.'}
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-slate-200">
            <p className="font-semibold text-slate-900">{user.email}</p>
            <p className="mt-0.5 text-xs text-slate-500">{admin ? 'Administrator area' : 'Attendee area'}</p>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading ? <LoadingPanel /> : (
          <>
            {admin ? (
              <>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryCard icon={<CalendarDays size={22} />} label="Total events" value={adminEvents.total || 0} note={`${adminEvents.upcoming || 0} upcoming published`} />
                  <SummaryCard icon={<Users size={22} />} label="Registrations" value={registrations.total || 0} note={`${registrations.confirmed || 0} confirmed`} />
                  <SummaryCard icon={<CreditCard size={22} />} label="Payment attempts" value={payments.total || 0} note={`${payments.pending || 0} currently pending`} />
                  <SummaryCard icon={<CircleDollarSign size={22} />} label="Successful payments" value={formatMoney(payments.paid_amount)} note={`${payments.paid || 0} paid attempts`} />
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="font-bold text-slate-950">Event status</h2>
                    <p className="mt-1 text-sm text-slate-500">Current event catalogue breakdown.</p>
                    <div className="mt-5 space-y-2.5">
                      <BreakdownRow label="Published" value={adminEvents.published || 0} className="bg-green-50 text-green-700" />
                      <BreakdownRow label="Draft" value={adminEvents.draft || 0} className="bg-amber-50 text-amber-700" />
                      <BreakdownRow label="Closed" value={adminEvents.closed || 0} />
                    </div>
                  </section>

                  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="font-bold text-slate-950">Registration status</h2>
                    <p className="mt-1 text-sm text-slate-500">All attendee registrations.</p>
                    <div className="mt-5 space-y-2.5">
                      <BreakdownRow label="Confirmed" value={registrations.confirmed || 0} className="bg-green-50 text-green-700" />
                      <BreakdownRow label="Pending payment" value={registrations.pending_payment || 0} className="bg-amber-50 text-amber-700" />
                      <BreakdownRow label="Cancelled" value={registrations.cancelled || 0} />
                    </div>
                  </section>

                  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="font-bold text-slate-950">Payment status</h2>
                    <p className="mt-1 text-sm text-slate-500">All payment attempts recorded.</p>
                    <div className="mt-5 space-y-2.5">
                      <BreakdownRow label="Paid" value={payments.paid || 0} className="bg-green-50 text-green-700" />
                      <BreakdownRow label="Pending" value={payments.pending || 0} className="bg-amber-50 text-amber-700" />
                      <BreakdownRow label="Failed" value={payments.failed || 0} className="bg-red-50 text-red-700" />
                    </div>
                  </section>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div><h2 className="font-bold text-slate-950">Recent registrations</h2><p className="mt-1 text-sm text-slate-500">The five newest registrations.</p></div>
                      <Link to="/admin/registrations" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View all →</Link>
                    </div>
                    <div className="mt-5 space-y-3">
                      {(dashboard?.recent_registrations || []).length === 0 ? (
                        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No registrations yet.</p>
                      ) : dashboard.recent_registrations.map((registration) => (
                        <div key={registration.id} className="rounded-2xl border border-slate-100 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div><p className="font-semibold text-slate-900">{registration.user_name}</p><p className="mt-1 text-sm text-slate-500">{registration.event_title}</p></div>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${registrationStatusClass(registration.status)}`}>{registrationStatusLabel(registration.status)}</span>
                          </div>
                          <p className="mt-2 text-xs text-slate-400">Registered {formatDate(registration.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div><h2 className="font-bold text-slate-950">Upcoming published events</h2><p className="mt-1 text-sm text-slate-500">Nearest events still accepting registrations.</p></div>
                      <Link to="/admin/events" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">Manage →</Link>
                    </div>
                    <div className="mt-5 space-y-3">
                      {(dashboard?.upcoming_events || []).length === 0 ? (
                        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No upcoming published events.</p>
                      ) : dashboard.upcoming_events.map((event) => (
                        <div key={event.id} className="rounded-2xl border border-slate-100 p-4">
                          <div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-slate-900">{event.title}</p><p className="mt-1 text-sm text-slate-500">{event.venue}</p></div><span className="text-xs font-bold text-indigo-600">{formatDate(event.event_date)}</span></div>
                          <p className="mt-2 text-xs text-slate-500">{Number(event.registration_count || 0)} of {Number(event.capacity || 0)} places registered</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </>
            ) : (
              <>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryCard icon={<TicketCheck size={22} />} label="My registrations" value={registrations.total || 0} note={`${registrations.confirmed || 0} confirmed`} />
                  <SummaryCard icon={<Clock3 size={22} />} label="Pending payment" value={registrations.pending_payment || 0} note="Registrations still awaiting successful payment" />
                  <SummaryCard icon={<WalletCards size={22} />} label="Payment attempts" value={payments.total || 0} note={`${payments.paid || 0} successful`} />
                  <SummaryCard icon={<CircleDollarSign size={22} />} label="Amount paid" value={formatMoney(payments.paid_amount)} note="Total of successful payment attempts" />
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div><h2 className="font-bold text-slate-950">Upcoming confirmed events</h2><p className="mt-1 text-sm text-slate-500">Your next confirmed event registrations.</p></div>
                      <Link to="/user/registrations" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View all →</Link>
                    </div>
                    <div className="mt-5 space-y-3">
                      {(dashboard?.upcoming_registrations || []).length === 0 ? (
                        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">You do not have an upcoming confirmed event yet.</p>
                      ) : dashboard.upcoming_registrations.map((registration) => (
                        <div key={registration.registration_id} className="rounded-2xl border border-slate-100 p-4">
                          <div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-slate-900">{registration.title}</p><p className="mt-1 text-sm text-slate-500">{registration.venue}</p></div><span className="text-xs font-bold text-indigo-600">{formatDate(registration.event_date)}</span></div>
                          <p className="mt-2 text-xs text-slate-500">Starts at {String(registration.start_time || '').slice(0, 5)}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div><h2 className="font-bold text-slate-950">Needs your attention</h2><p className="mt-1 text-sm text-slate-500">Registrations that still need payment.</p></div>
                      <Link to="/user/registrations" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">Open payments →</Link>
                    </div>
                    <div className="mt-5 space-y-3">
                      {(dashboard?.pending_registrations || []).length === 0 ? (
                        <p className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700">No pending registration payments.</p>
                      ) : dashboard.pending_registrations.map((registration) => (
                        <div key={registration.registration_id} className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                          <div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-slate-900">{registration.title}</p><p className="mt-1 text-sm text-slate-500">{formatDate(registration.event_date)}</p></div><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">{formatMoney(registration.registration_fee)}</span></div>
                          <p className="mt-2 text-xs text-slate-500">Latest payment: {registration.latest_payment_status || 'No attempt yet'}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </>
            )}
          </>
        )}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-950">Quick actions</h2>
          <p className="mt-1 text-sm text-slate-500">Open the main areas you use most often.</p>
          {admin ? (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Link to="/admin/events" className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 hover:bg-indigo-100/70"><div className="flex items-center gap-3"><CalendarDays className="text-indigo-600" size={21} /><span className="font-bold text-slate-900">Manage events</span></div><span className="font-bold text-indigo-700">→</span></Link>
              <Link to="/admin/registrations" className="flex items-center justify-between gap-4 rounded-2xl border border-sky-100 bg-sky-50 p-5 hover:bg-sky-100/70"><div className="flex items-center gap-3"><TicketCheck className="text-sky-600" size={21} /><span className="font-bold text-slate-900">Registrations</span></div><span className="font-bold text-sky-700">→</span></Link>
              <Link to="/admin/payments" className="flex items-center justify-between gap-4 rounded-2xl border border-violet-100 bg-violet-50 p-5 hover:bg-violet-100/70"><div className="flex items-center gap-3"><CircleDollarSign className="text-violet-600" size={21} /><span className="font-bold text-slate-900">Payments</span></div><span className="font-bold text-violet-700">→</span></Link>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Link to="/user/events" className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 hover:bg-indigo-100/70"><div className="flex items-center gap-3"><Search className="text-indigo-600" size={21} /><span className="font-bold text-slate-900">Browse events</span></div><span className="font-bold text-indigo-700">→</span></Link>
              <Link to="/user/registrations" className="flex items-center justify-between gap-4 rounded-2xl border border-violet-100 bg-violet-50 p-5 hover:bg-violet-100/70"><div className="flex items-center gap-3"><TicketCheck className="text-violet-600" size={21} /><span className="font-bold text-slate-900">My registrations</span></div><span className="font-bold text-violet-700">→</span></Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
