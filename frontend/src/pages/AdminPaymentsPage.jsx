import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
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

function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-ZW', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatMoney(value) {
  return `US$${Number(value || 0).toFixed(2)}`;
}

function paymentStatusLabel(status) {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1).replaceAll('_', ' ');
}

function registrationStatusLabel(status) {
  if (status === 'pending_payment') return 'Pending payment';
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1).replaceAll('_', ' ');
}

function PaymentBadge({ status }) {
  const styles = {
    paid: 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300',
    pending: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    failed: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status] || 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
      {paymentStatusLabel(status)}
    </span>
  );
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

function SummaryCard({ icon: Icon, label, value, hint, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
    green: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    red: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300',
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
    <div className="space-y-3 p-4 sm:p-5" aria-label="Loading payment attempts">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  );
}

function PaymentAction({ payment, checking, onCheck }) {
  const canPoll = Boolean(Number(payment.can_poll));
  const isChecking = checking === payment.reference;

  if (payment.status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 dark:text-green-300">
        <CheckCircle2 size={15} /> Confirmed
      </span>
    );
  }

  if (!canPoll) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
        <AlertCircle size={14} /> No poll URL
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onCheck(payment)}
      disabled={checking !== null}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-indigo-500/20"
    >
      <RefreshCw size={15} className={isChecking ? 'animate-spin' : ''} />
      {isChecking ? 'Checking...' : 'Check Paynow'}
    </button>
  );
}

function MobilePaymentCard({ payment, checking, onCheck }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold text-slate-950 dark:text-white">{payment.user_name}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{payment.user_email}</p>
        </div>
        <PaymentBadge status={payment.status} />
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
        <p className="font-semibold text-slate-900 dark:text-white">{payment.event_title}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <CalendarDays size={13} />
          {formatDateTime(payment.event_date)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Amount</p>
          <p className="mt-1 font-black text-slate-950 dark:text-white">{formatMoney(payment.amount)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Registration</p>
          <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">#{payment.registration_id}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <RegistrationBadge status={payment.registration_status} />
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Reference</p>
        <p className="mt-1 break-all font-mono text-[11px] text-slate-600 dark:text-slate-300">{payment.reference}</p>
        {payment.paynow_reference && (
          <p className="mt-1 break-all text-[11px] text-slate-400 dark:text-slate-500">Paynow: {payment.paynow_reference}</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <p className="text-xs text-slate-400 dark:text-slate-500">Created {formatDateTime(payment.created_at)}</p>
        <PaymentAction payment={payment} checking={checking} onCheck={onCheck} />
      </div>
    </article>
  );
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadPayments = async (nextSearch = search, nextStatus = status) => {
    setLoading(true);
    setError('');

    try {
      const trimmedSearch = nextSearch.trim();
      const params = {};
      if (trimmedSearch) params.search = trimmedSearch;
      if (nextStatus) params.status = nextStatus;

      const response = await api.get('/admin/payments', { params });
      setPayments(response.data.payments || []);
      setActiveSearch(trimmedSearch);
      setActiveStatus(nextStatus);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments('', '');
    // Initial load only; filters are applied explicitly by the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkPayment = async (payment) => {
    setChecking(payment.reference);
    setError('');
    setMessage('');

    try {
      const response = await api.post(`/admin/payments/${encodeURIComponent(payment.reference)}/check`);
      setMessage(response.data.message || 'Payment status checked.');
      await loadPayments(activeSearch, activeStatus);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to check Paynow payment status.');
    } finally {
      setChecking(null);
    }
  };

  const totals = useMemo(() => ({
    paid: payments.filter((payment) => payment.status === 'paid').length,
    pending: payments.filter((payment) => payment.status === 'pending').length,
    failed: payments.filter((payment) => payment.status === 'failed').length,
    paidAmount: payments
      .filter((payment) => payment.status === 'paid')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
  }), [payments]);

  const hasActiveFilters = Boolean(activeSearch || activeStatus);

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setMessage('');
    loadPayments('', '');
  };

  const applyStatus = (nextStatus) => {
    setStatus(nextStatus);
    setMessage('');
    loadPayments(search, nextStatus);
  };

  return (
    <AppShell role="admin">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="relative px-5 py-6 sm:px-7 sm:py-7">
            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-indigo-100/70 blur-3xl dark:bg-indigo-500/10" />
            <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div className="max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Payment operations</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">Payment attempts</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                  Review Paynow activity, trace attempts back to attendees and events, and manually refresh eligible payment statuses when needed.
                </p>
              </div>
              <Link
                to="/admin/registrations"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 dark:focus-visible:ring-violet-500/20"
              >
                <TicketCheck size={18} />
                View registrations
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={CircleDollarSign}
            label="Paid amount shown"
            value={formatMoney(totals.paidAmount)}
            hint={hasActiveFilters ? 'Filtered result set' : 'Across loaded paid attempts'}
            tone="green"
          />
          <SummaryCard icon={CheckCircle2} label="Paid attempts" value={totals.paid} hint="Confirmed payment attempts" tone="green" />
          <SummaryCard icon={Clock3} label="Pending attempts" value={totals.pending} hint="Awaiting confirmation" tone="amber" />
          <SummaryCard icon={XCircle} label="Failed attempts" value={totals.failed} hint="Unsuccessful attempts" tone="red" />
        </section>

        {message && (
          <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300" role="status">
            <CheckCircle2 size={17} />
            {message}
          </div>
        )}

        {error && (
          <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <span className="font-semibold">{error}</span>
            <button
              type="button"
              onClick={() => loadPayments(activeSearch, activeStatus)}
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
                setMessage('');
                loadPayments();
              }}
              className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]"
            >
              <label className="relative block">
                <span className="sr-only">Search payments</span>
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search attendee, email, event or payment reference"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                />
              </label>

              <label>
                <span className="sr-only">Payment status</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                >
                  <option value="">All statuses</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
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

            <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Quick payment status filters">
              {[
                ['', 'All'],
                ['paid', 'Paid'],
                ['pending', 'Pending'],
                ['failed', 'Failed'],
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
                Showing {payments.length} result{payments.length === 1 ? '' : 's'}
                {activeSearch ? ` for “${activeSearch}”` : ''}
                {activeStatus ? ` with status ${paymentStatusLabel(activeStatus).toLowerCase()}` : ''}.
              </p>
            )}
          </div>

          {loading ? (
            <LoadingTable />
          ) : payments.length === 0 ? (
            <div className="px-5 py-16 text-center sm:px-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <CreditCard size={24} />
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">No payment attempts found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                {hasActiveFilters
                  ? 'No payment attempts match the current filters. Clear or adjust them and try again.'
                  : 'Payment attempts will appear here after attendees initiate Paynow payments.'}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-3 p-4 md:hidden">
                {payments.map((payment) => (
                  <MobilePaymentCard key={payment.id} payment={payment} checking={checking} onCheck={checkPayment} />
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1320px] border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="text-left text-xs font-black uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                      <th className="sticky left-0 z-20 min-w-[230px] border-b border-r border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950">Attendee</th>
                      <th className="min-w-[240px] border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950">Event</th>
                      <th className="min-w-[120px] border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950">Amount</th>
                      <th className="min-w-[260px] border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950">Reference</th>
                      <th className="min-w-[160px] border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950">Registration</th>
                      <th className="min-w-[120px] border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950">Status</th>
                      <th className="min-w-[190px] border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950">Created</th>
                      <th className="min-w-[170px] border-b border-l border-slate-200 bg-slate-50 px-5 py-4 text-right dark:border-slate-800 dark:bg-slate-950">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="group align-top">
                        <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-5 py-4 transition group-hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:group-hover:bg-slate-800/80">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                              <UserRound size={17} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-950 dark:text-white">{payment.user_name}</p>
                              <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{payment.user_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="border-b border-slate-100 px-5 py-4 transition group-hover:bg-slate-50/70 dark:border-slate-800 dark:group-hover:bg-slate-800/40">
                          <p className="font-semibold text-slate-900 dark:text-white">{payment.event_title}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDateTime(payment.event_date)}</p>
                        </td>
                        <td className="border-b border-slate-100 px-5 py-4 font-black text-slate-950 transition group-hover:bg-slate-50/70 dark:border-slate-800 dark:text-white dark:group-hover:bg-slate-800/40">
                          {formatMoney(payment.amount)}
                        </td>
                        <td className="border-b border-slate-100 px-5 py-4 transition group-hover:bg-slate-50/70 dark:border-slate-800 dark:group-hover:bg-slate-800/40">
                          <p className="break-all font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">{payment.reference}</p>
                          {payment.paynow_reference && (
                            <p className="mt-1 break-all text-xs text-slate-400 dark:text-slate-500">Paynow: {payment.paynow_reference}</p>
                          )}
                        </td>
                        <td className="border-b border-slate-100 px-5 py-4 transition group-hover:bg-slate-50/70 dark:border-slate-800 dark:group-hover:bg-slate-800/40">
                          <p className="mb-2 text-xs font-black text-slate-700 dark:text-slate-300">#{payment.registration_id}</p>
                          <RegistrationBadge status={payment.registration_status} />
                        </td>
                        <td className="border-b border-slate-100 px-5 py-4 transition group-hover:bg-slate-50/70 dark:border-slate-800 dark:group-hover:bg-slate-800/40">
                          <PaymentBadge status={payment.status} />
                        </td>
                        <td className="border-b border-slate-100 px-5 py-4 text-slate-500 transition group-hover:bg-slate-50/70 dark:border-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-800/40">
                          {formatDateTime(payment.created_at)}
                        </td>
                        <td className="border-b border-l border-slate-100 bg-white px-5 py-4 text-right transition group-hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:group-hover:bg-slate-800/80">
                          <PaymentAction payment={payment} checking={checking} onCheck={checkPayment} />
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
