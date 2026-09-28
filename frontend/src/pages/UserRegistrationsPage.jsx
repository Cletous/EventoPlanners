import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  MapPin,
  RefreshCw,
  RotateCcw,
  Search,
  TicketCheck,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../services/api';

function formatDate(value) {
  if (!value) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-ZW', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${String(value).slice(0, 10)}T00:00:00`));
}

function formatTime(value) {
  if (!value) return 'Time unavailable';
  return String(value).slice(0, 5);
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return amount === 0 ? 'Free' : `US$${amount.toFixed(2)}`;
}

function statusMeta(status) {
  if (status === 'confirmed') {
    return {
      label: 'Confirmed',
      icon: CheckCircle2,
      className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
    };
  }

  if (status === 'pending_payment') {
    return {
      label: 'Pending payment',
      icon: Clock3,
      className: 'bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
    };
  }

  return {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-slate-100 text-slate-600 ring-slate-500/10 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/20',
  };
}

function SummaryCard({ icon: Icon, label, value, helper, tone = 'indigo' }) {
  const toneClasses = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{helper}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-2" aria-label="Loading registrations">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex justify-between gap-4">
            <div className="h-6 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-14 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="mt-5 h-7 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-6 space-y-3">
            <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-4 w-5/6 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="mt-6 h-12 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

export default function UserRegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [checkingReference, setCheckingReference] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/registrations');
      setRegistrations(response.data.registrations || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load registrations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  const totals = useMemo(() => ({
    all: registrations.length,
    confirmed: registrations.filter((item) => item.status === 'confirmed').length,
    pending: registrations.filter((item) => item.status === 'pending_payment').length,
    cancelled: registrations.filter((item) => item.status === 'cancelled').length,
  }), [registrations]);

  const filteredRegistrations = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return registrations.filter((registration) => {
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'pending' && registration.status === 'pending_payment')
        || registration.status === statusFilter;
      const matchesSearch = !needle
        || registration.title?.toLowerCase().includes(needle)
        || registration.venue?.toLowerCase().includes(needle)
        || String(registration.id).includes(needle);
      return matchesStatus && matchesSearch;
    });
  }, [query, registrations, statusFilter]);

  const startPayment = async (registration) => {
    setPayingId(registration.id);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/payments/paynow/initiate', {
        registration_id: registration.id,
      });

      const redirectUrl = response.data.redirect_url;
      if (!redirectUrl) {
        throw new Error('Paynow did not provide a checkout URL.');
      }

      window.location.assign(redirectUrl);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
          || requestError.message
          || 'Unable to start Paynow payment.',
      );
      setPayingId(null);
    }
  };

  const checkPayment = async (registration) => {
    const reference = registration.latest_payment_reference;
    if (!reference) return;

    setCheckingReference(reference);
    setError('');
    setMessage('');

    try {
      const response = await api.post(`/payments/${encodeURIComponent(reference)}/check`);
      setMessage(response.data.message || 'Payment status checked.');
      await loadRegistrations();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to check Paynow payment status.');
    } finally {
      setCheckingReference(null);
    }
  };

  const cancelRegistration = async () => {
    if (!cancelTarget) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const response = await api.patch(`/registrations/${cancelTarget.id}`);
      setMessage(response.data.message || 'Registration cancelled.');
      setCancelTarget(null);
      await loadRegistrations();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to cancel registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetFilters = () => {
    setQuery('');
    setStatusFilter('all');
  };

  return (
    <AppShell role="user">
      <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-6 py-7 text-white shadow-lg shadow-indigo-950/10 dark:border-indigo-500/20 dark:from-indigo-600 dark:via-indigo-700 dark:to-violet-800 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] ring-1 ring-white/20">
              <TicketCheck size={15} /> My registrations
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Everything you have registered for, in one place.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
              Review your event places, complete outstanding Paynow payments, check payment status, or cancel an eligible unpaid registration.
            </p>
          </div>
          <Link
            to="/user/events"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 sm:w-auto"
          >
            <CalendarDays size={18} /> Browse more events
          </Link>
        </div>
      </section>

      {!loading && registrations.length > 0 && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={TicketCheck} label="Total registrations" value={totals.all} helper="All registration records" />
          <SummaryCard icon={CheckCircle2} label="Confirmed" value={totals.confirmed} helper="Your secured event places" tone="green" />
          <SummaryCard icon={Clock3} label="Awaiting payment" value={totals.pending} helper="Action may still be required" tone="amber" />
          <SummaryCard icon={XCircle} label="Cancelled" value={totals.cancelled} helper="No longer active" tone="slate" />
        </section>
      )}

      {(message || error) && (
        <div className="mt-6 space-y-3" aria-live="polite">
          {message && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 shrink-0" size={19} />
              <div><p className="font-bold">Update complete</p><p className="mt-0.5 text-emerald-700 dark:text-emerald-300">{message}</p></div>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
              <AlertCircle className="mt-0.5 shrink-0" size={19} />
              <div><p className="font-bold">Something needs attention</p><p className="mt-0.5 text-red-700 dark:text-red-300">{error}</p></div>
            </div>
          )}
        </div>
      )}

      {!loading && registrations.length > 0 && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1 lg:max-w-xl">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by event, venue or registration ID"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-slate-950 dark:focus:ring-indigo-500/15"
              />
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter registrations by status">
              {[
                ['all', `All ${totals.all}`],
                ['confirmed', `Confirmed ${totals.confirmed}`],
                ['pending', `Pending ${totals.pending}`],
                ['cancelled', `Cancelled ${totals.cancelled}`],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-500/20 ${
                    statusFilter === value
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {loading ? (
        <LoadingState />
      ) : registrations.length === 0 ? (
        <section className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:py-20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            <CalendarDays size={30} />
          </div>
          <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950 dark:text-white">No registrations yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Browse published events and register for one. Your event places and payment status will appear here.</p>
          <Link to="/user/events" className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-500/20">
            Browse available events
          </Link>
        </section>
      ) : filteredRegistrations.length === 0 ? (
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Search className="mx-auto text-slate-300 dark:text-slate-600" size={42} />
          <h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">No matching registrations</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Try a different search term or status filter.</p>
          <button type="button" onClick={resetFilters} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            <RotateCcw size={16} /> Reset filters
          </button>
        </section>
      ) : (
        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          {filteredRegistrations.map((registration) => {
            const hasPayment = Boolean(registration.latest_payment_reference);
            const canPoll = Boolean(Number(registration.latest_payment_pollable));
            const paymentPending = registration.latest_payment_status === 'pending';
            const status = statusMeta(registration.status);
            const StatusIcon = status.icon;
            const checkingThis = checkingReference === registration.latest_payment_reference;
            const payingThis = payingId === registration.id;
            const actionsDisabled = checkingReference !== null || payingId !== null;

            return (
              <article key={registration.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
                <div className="border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${status.className}`}>
                        <StatusIcon size={14} /> {status.label}
                      </span>
                      <h2 className="mt-3 text-xl font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-2xl">{registration.title}</h2>
                    </div>
                    <div className="shrink-0 rounded-xl bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-400 dark:bg-slate-950 dark:text-slate-500">#{registration.id}</div>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                    <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/80">
                      <CalendarDays size={17} className="mt-0.5 shrink-0 text-indigo-500 dark:text-indigo-300" />
                      <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Date & time</p><p className="mt-0.5 font-semibold">{formatDate(registration.event_date)} · {formatTime(registration.start_time)}</p></div>
                    </div>
                    <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/80">
                      <MapPin size={17} className="mt-0.5 shrink-0 text-indigo-500 dark:text-indigo-300" />
                      <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Venue</p><p className="mt-0.5 truncate font-semibold">{registration.venue || 'Venue unavailable'}</p></div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4 rounded-xl bg-indigo-50 px-4 py-3 dark:bg-indigo-500/10">
                    <div className="flex items-center gap-2 text-sm font-bold text-indigo-700 dark:text-indigo-200"><CircleDollarSign size={18} /> Registration fee</div>
                    <div className="font-black text-indigo-950 dark:text-indigo-100">{formatMoney(registration.registration_fee)}</div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  {registration.status === 'pending_payment' && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                        <div className="flex items-start gap-3">
                          <Clock3 size={19} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" />
                          <div>
                            <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Payment required to confirm your place</p>
                            <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-300">
                              {hasPayment
                                ? `Latest Paynow attempt: ${registration.latest_payment_status || 'unknown'}.`
                                : 'No Paynow attempt has been recorded yet.'}
                            </p>
                            {hasPayment && (
                              <p className="mt-1 break-all font-mono text-[11px] text-amber-600/80 dark:text-amber-400/80">{registration.latest_payment_reference}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {hasPayment && paymentPending && canPoll && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => checkPayment(registration)}
                            disabled={actionsDisabled}
                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-violet-500/20"
                          >
                            <RefreshCw size={17} className={checkingThis ? 'animate-spin' : ''} />
                            {checkingThis ? 'Checking Paynow...' : 'Check payment status'}
                          </button>
                          <button
                            type="button"
                            onClick={() => startPayment(registration)}
                            disabled={actionsDisabled}
                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-indigo-500/20"
                          >
                            <CreditCard size={17} />
                            {payingThis ? 'Opening Paynow...' : 'Make a new payment'}
                          </button>
                        </div>
                      )}

                      {hasPayment && paymentPending && !canPoll && (
                        <div className="rounded-xl border border-amber-200 bg-white p-3 text-xs leading-5 text-amber-800 dark:border-amber-500/20 dark:bg-slate-950 dark:text-amber-200">
                          This older payment attempt has no saved Paynow poll URL. Start a new payment attempt to enable status checking.
                        </div>
                      )}

                      {(!paymentPending || !canPoll) && (
                        <button
                          type="button"
                          onClick={() => startPayment(registration)}
                          disabled={actionsDisabled}
                          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-indigo-500/20"
                        >
                          <CreditCard size={17} />
                          {payingThis ? 'Opening Paynow...' : hasPayment ? 'Start new Paynow payment' : 'Pay with Paynow'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setCancelTarget(registration)}
                        disabled={actionsDisabled}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/30 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-500/10 dark:focus-visible:ring-red-500/20"
                      >
                        <XCircle size={17} /> Cancel unpaid registration
                      </button>
                    </div>
                  )}

                  {registration.status === 'confirmed' && (
                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                      <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300" />
                      <div><p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Your place is confirmed</p><p className="mt-1 text-xs leading-5 text-emerald-700 dark:text-emerald-300">No further payment action is required for this registration.</p></div>
                    </div>
                  )}

                  {registration.status === 'cancelled' && (
                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/80">
                      <XCircle size={20} className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400" />
                      <div><p className="text-sm font-bold text-slate-800 dark:text-slate-200">This registration is cancelled</p><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">You may register again while the event remains published and has capacity.</p></div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel registration?"
        message={cancelTarget ? `Cancel your unpaid registration for “${cancelTarget.title}”? You can register again later if places remain.` : ''}
        confirmLabel="Cancel registration"
        cancelLabel="Keep registration"
        busy={submitting}
        onConfirm={cancelRegistration}
        onCancel={() => !submitting && setCancelTarget(null)}
        danger
      />
    </AppShell>
  );
}
