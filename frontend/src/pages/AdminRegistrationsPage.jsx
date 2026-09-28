import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  RefreshCw,
  Search,
  TicketCheck,
  UserRound,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import api from '../services/api';

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(
    new Date(`${String(value).slice(0, 10)}T00:00:00`),
  );
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-ZW', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return '—';
  return String(value).slice(0, 5);
}

function formatMoney(value) {
  return `US$${Number(value || 0).toFixed(2)}`;
}

function registrationStatusLabel(status) {
  if (status === 'pending_payment') return 'Pending payment';
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1).replaceAll('_', ' ');
}

function RegistrationBadge({ status }) {
  const styles = {
    confirmed: 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300',
    pending_payment: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    cancelled: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status] || styles.cancelled}`}>
      {registrationStatusLabel(status)}
    </span>
  );
}

function PaymentBadge({ status }) {
  const styles = {
    paid: 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300',
    failed: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
    pending: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
  };

  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'No payment';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status] || 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
      {label}
    </span>
  );
}

function SummaryCard({ icon: Icon, label, value, hint, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
    green: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone] || tones.indigo}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function LoadingTable() {
  return (
    <div className="space-y-3 p-4 sm:p-5" aria-label="Loading registrations">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  );
}

function MobileRegistrationCard({ registration }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold text-slate-950 dark:text-white">{registration.user_name}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{registration.user_email}</p>
        </div>
        <RegistrationBadge status={registration.status} />
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
        <p className="font-semibold text-slate-900 dark:text-white">{registration.event_title}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{registration.event_venue}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <CalendarDays size={13} />
          {formatDate(registration.event_date)} at {formatTime(registration.start_time)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Registration</p>
          <p className="mt-1 font-bold text-slate-800 dark:text-slate-200">#{registration.id}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Payment attempts</p>
          <p className="mt-1 font-bold text-slate-800 dark:text-slate-200">{Number(registration.payment_attempt_count || 0)}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <PaymentBadge status={registration.latest_payment_status} />
          {registration.latest_payment_reference && (
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {formatMoney(registration.latest_payment_amount)}
            </span>
          )}
        </div>
        {registration.latest_payment_reference ? (
          <>
            <p className="mt-2 break-all font-mono text-[11px] text-slate-500 dark:text-slate-400">{registration.latest_payment_reference}</p>
            {registration.latest_paynow_reference && (
              <p className="mt-1 break-all text-[11px] text-slate-400 dark:text-slate-500">Paynow: {registration.latest_paynow_reference}</p>
            )}
          </>
        ) : (
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">No payment attempts recorded.</p>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">Registered {formatDateTime(registration.created_at)}</p>
    </article>
  );
}

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRegistrations = async (nextSearch = search, nextStatus = status) => {
    setLoading(true);
    setError('');

    try {
      const trimmedSearch = nextSearch.trim();
      const params = {};
      if (trimmedSearch) params.search = trimmedSearch;
      if (nextStatus) params.status = nextStatus;

      const response = await api.get('/admin/registrations', { params });
      setRegistrations(response.data.registrations || []);
      setActiveSearch(trimmedSearch);
      setActiveStatus(nextStatus);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations('', '');
    // Initial load only; filters are applied explicitly by the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => ({
    confirmed: registrations.filter((item) => item.status === 'confirmed').length,
    pending: registrations.filter((item) => item.status === 'pending_payment').length,
    cancelled: registrations.filter((item) => item.status === 'cancelled').length,
  }), [registrations]);

  const hasActiveFilters = Boolean(activeSearch || activeStatus);

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    loadRegistrations('', '');
  };

  const applyStatus = (nextStatus) => {
    setStatus(nextStatus);
    loadRegistrations(search, nextStatus);
  };

  return (
    <AppShell role="admin">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="relative px-5 py-6 sm:px-7 sm:py-7">
            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-violet-100/70 blur-3xl dark:bg-violet-500/10" />
            <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div className="max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Attendee operations</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">Registration management</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                  Review who registered, which events they selected, and the latest payment activity without losing attendee context while scrolling.
                </p>
              </div>
              <Link
                to="/admin/payments"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 dark:focus-visible:ring-violet-500/20"
              >
                <CircleDollarSign size={18} />
                Payment attempts
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={UserRound}
            label="Registrations shown"
            value={registrations.length}
            hint={hasActiveFilters ? 'Filtered result set' : 'Current registration list'}
          />
          <SummaryCard icon={CheckCircle2} label="Confirmed" value={totals.confirmed} hint="Places confirmed" tone="green" />
          <SummaryCard icon={Clock3} label="Pending payment" value={totals.pending} hint="Awaiting successful payment" tone="amber" />
          <SummaryCard icon={XCircle} label="Cancelled" value={totals.cancelled} hint="No longer active" tone="slate" />
        </section>

        {error && (
          <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <span className="font-semibold">{error}</span>
            <button
              type="button"
              onClick={() => loadRegistrations(activeSearch, activeStatus)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-500/10"
            >
              <RefreshCw size={14} />
              Try again
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                loadRegistrations();
              }}
              className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]"
            >
              <label className="relative block">
                <span className="sr-only">Search registrations</span>
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search attendee, email, event or venue"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                />
              </label>

              <label>
                <span className="sr-only">Registration status</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                >
                  <option value="">All statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending_payment">Pending payment</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:focus-visible:ring-slate-700 lg:flex-none"
                >
                  <Search size={16} />
                  Apply
                </button>
                {(search || status || hasActiveFilters) && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:ring-indigo-500/20"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Quick registration status filters">
              {[
                ['', 'All'],
                ['confirmed', 'Confirmed'],
                ['pending_payment', 'Pending payment'],
                ['cancelled', 'Cancelled'],
              ].map(([value, label]) => {
                const selected = activeStatus === value;
                return (
                  <button
                    type="button"
                    key={value || 'all'}
                    onClick={() => applyStatus(value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-500/20 ${selected
                      ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {hasActiveFilters && !loading && (
              <p className="mt-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
                Showing {registrations.length} result{registrations.length === 1 ? '' : 's'}
                {activeSearch ? ` for “${activeSearch}”` : ''}
                {activeStatus ? ` with status ${registrationStatusLabel(activeStatus).toLowerCase()}` : ''}.
              </p>
            )}
          </div>

          {loading ? (
            <LoadingTable />
          ) : registrations.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <TicketCheck size={28} />
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">No registrations found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                {hasActiveFilters ? 'Try clearing or adjusting the search and status filters.' : 'Registrations will appear here after attendees begin registering for published events.'}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3 p-4 md:hidden">
                {registrations.map((registration) => (
                  <MobileRegistrationCard key={registration.id} registration={registration} />
                ))}
              </div>

              <div className="relative isolate hidden overflow-x-auto overscroll-x-contain md:block">
                <table className="w-full min-w-[1280px] border-separate border-spacing-0 text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                    <tr>
                      <th className="sticky left-0 z-20 w-[260px] min-w-[260px] max-w-[260px] border-r border-slate-200 bg-slate-50 px-5 py-4 shadow-[6px_0_10px_-10px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950">Attendee</th>
                      <th className="px-5 py-4">Event</th>
                      <th className="px-5 py-4">Registration</th>
                      <th className="px-5 py-4">Attempts</th>
                      <th className="px-5 py-4">Latest payment</th>
                      <th className="px-5 py-4">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {registrations.map((registration) => (
                      <tr key={registration.id} className="group align-top transition hover:bg-slate-50/80 dark:hover:bg-slate-800/35">
                        <td className="sticky left-0 z-10 w-[260px] min-w-[260px] max-w-[260px] border-r border-slate-100 bg-white px-5 py-4 shadow-[6px_0_10px_-10px_rgba(15,23,42,0.35)] transition group-hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:group-hover:bg-slate-800">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-black text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                              {String(registration.user_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-950 dark:text-white">{registration.user_name}</p>
                              <p className="mt-1 max-w-[180px] truncate text-xs text-slate-500 dark:text-slate-400">{registration.user_email}</p>
                              <p className="mt-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">User #{registration.user_id}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-[260px] font-bold text-slate-900 dark:text-white">{registration.event_title}</p>
                          <p className="mt-1 max-w-[260px] text-xs text-slate-500 dark:text-slate-400">{registration.event_venue}</p>
                          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                            <CalendarDays size={13} />
                            {formatDate(registration.event_date)} at {formatTime(registration.start_time)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <RegistrationBadge status={registration.status} />
                          <p className="mt-2 text-xs font-semibold text-slate-400 dark:text-slate-500">Registration #{registration.id}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Fee: {formatMoney(registration.registration_fee)}</p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-lg font-black text-slate-900 dark:text-white">{Number(registration.payment_attempt_count || 0)}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{Number(registration.paid_payment_count || 0)} paid</p>
                        </td>

                        <td className="px-5 py-4">
                          {registration.latest_payment_reference ? (
                            <div className="max-w-[260px]">
                              <div className="flex flex-wrap items-center gap-2">
                                <PaymentBadge status={registration.latest_payment_status} />
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{formatMoney(registration.latest_payment_amount)}</span>
                              </div>
                              <p className="mt-2 break-all font-mono text-[11px] text-slate-500 dark:text-slate-400">{registration.latest_payment_reference}</p>
                              {registration.latest_paynow_reference && (
                                <p className="mt-1 break-all text-[11px] text-slate-400 dark:text-slate-500">Paynow: {registration.latest_paynow_reference}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">No payment attempts</span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">{formatDate(registration.created_at)}</p>
                          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{formatDateTime(registration.created_at).split(', ').slice(-1)[0]}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}
