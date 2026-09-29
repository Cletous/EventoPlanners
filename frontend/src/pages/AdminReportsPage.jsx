import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
  FileBarChart,
  FilterX,
  RefreshCw,
  TicketCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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

function formatMoney(value) {
  return `US$${Number(value || 0).toFixed(2)}`;
}


function paymentMethodLabel(method) {
  if (method === 'bank_transfer') return 'Bank transfer';
  if (method === 'manual') return 'Manual payment';
  return 'Paynow';
}

function statusLabel(status) {
  if (status === 'pending_payment') return 'Pending payment';
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1).replaceAll('_', ' ');
}

function StatusBadge({ status }) {
  const styles = {
    paid: 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300',
    confirmed: 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300',
    published: 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300',
    pending: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    pending_payment: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    draft: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    failed: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
    closed: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
    cancelled: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status] || styles.closed}`}>
      {statusLabel(status)}
    </span>
  );
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(filename, headers, rows) {
  const content = [
    headers.map(csvCell).join(','),
    ...rows.map((row) => row.map(csvCell).join(',')),
  ].join('\r\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function SummaryCard({ icon: Icon, label, value, note, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
    green: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
          {note && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{note}</p>}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tones[tone] || tones.indigo}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-5" aria-label="Generating reports">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-56 animate-pulse rounded-3xl bg-slate-200/70 dark:bg-slate-800" />
      ))}
    </div>
  );
}

function EmptyReport({ message }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <FileBarChart size={21} />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">{message}</p>
      <p className="mt-1 max-w-md text-xs leading-5 text-slate-400 dark:text-slate-500">Adjust the report filters or clear them to view a broader data set.</p>
    </div>
  );
}

function ReportSection({ title, description, count, onExport, disabled, children }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black tracking-tight text-slate-950 dark:text-white">{title}</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{count}</span>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <button
          type="button"
          onClick={onExport}
          disabled={disabled}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-indigo-500/20"
        >
          <Download size={16} />
          Download CSV
        </button>
      </div>
      {children}
    </section>
  );
}

function EventMobileCard({ event }) {
  const active = Number(event.confirmed_count || 0) + Number(event.pending_count || 0);
  const capacity = Number(event.capacity || 0);
  const fillRate = capacity > 0 ? ((active / capacity) * 100).toFixed(1) : '0.0';

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-bold text-slate-950 dark:text-white">{event.title}</h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{event.venue} · {formatDate(event.event_date)}</p>
        </div>
        <StatusBadge status={event.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Registrations</p>
          <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{event.registration_count}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Paid amount</p>
          <p className="mt-1 text-lg font-black text-green-700 dark:text-green-300">{formatMoney(event.paid_amount)}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Capacity use</span>
          <span>{active}/{capacity} · {fillRate}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(Number(fillRate), 100)}%` }} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-lg bg-green-50 px-2.5 py-1.5 font-bold text-green-700 dark:bg-green-500/10 dark:text-green-300">{event.confirmed_count} confirmed</span>
        <span className="rounded-lg bg-amber-50 px-2.5 py-1.5 font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">{event.pending_count} pending</span>
        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{event.cancelled_count} cancelled</span>
      </div>
    </article>
  );
}

function RegistrationMobileCard({ registration }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold text-slate-950 dark:text-white">{registration.user_name}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{registration.user_email}</p>
        </div>
        <StatusBadge status={registration.status} />
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
        <p className="font-semibold text-slate-900 dark:text-white">{registration.event_title}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(registration.event_date)}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Fee</p>
          <p className="mt-1 font-black text-slate-950 dark:text-white">{formatMoney(registration.registration_fee)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Payments</p>
          <p className="mt-1 font-bold text-slate-800 dark:text-slate-200">{registration.payment_attempt_count} attempts</p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{registration.paid_payment_count} paid</p>
        </div>
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">Registered {formatDateTime(registration.created_at)}</p>
    </article>
  );
}

function PaymentMobileCard({ payment }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold text-slate-950 dark:text-white">{payment.user_name}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{payment.user_email}</p>
        </div>
        <StatusBadge status={payment.status} />
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
        <p className="font-semibold text-slate-900 dark:text-white">{payment.event_title}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(payment.event_date)}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Amount</p>
          <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{formatMoney(payment.amount)}</p>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">#{payment.registration_id}</p>
      </div>
      <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
        <p className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-300">{paymentMethodLabel(payment.payment_method)}</p>
        <p className="break-all font-mono text-[11px] text-slate-600 dark:text-slate-300">{payment.reference}</p>
        {payment.paynow_reference && <p className="mt-1 break-all text-[11px] text-slate-400 dark:text-slate-500">Paynow: {payment.paynow_reference}</p>}
        {payment.external_reference && <p className="mt-1 break-all text-[11px] text-slate-400 dark:text-slate-500">External: {payment.external_reference}</p>}
        {payment.confirmed_by_name && <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Confirmed by {payment.confirmed_by_name}</p>}
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Created {formatDateTime(payment.created_at)}</p>
      </div>
    </article>
  );
}

export default function AdminReportsPage() {
  const [filters, setFilters] = useState({ from: '', to: '', event_id: '' });
  const [appliedFilters, setAppliedFilters] = useState({ from: '', to: '', event_id: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = async (nextFilters = filters) => {
    if (nextFilters.from && nextFilters.to && nextFilters.from > nextFilters.to) {
      setError('The start date cannot be after the end date.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = {};
      if (nextFilters.from) params.from = nextFilters.from;
      if (nextFilters.to) params.to = nextFilters.to;
      if (nextFilters.event_id) params.event_id = nextFilters.event_id;
      const response = await api.get('/admin/reports', { params });
      setReport(response.data.report);
      setAppliedFilters({ ...nextFilters });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to generate reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport({ from: '', to: '', event_id: '' });
    // Initial report only. Filters are applied explicitly with the Generate report button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = report?.summary || {};
  const events = report?.events || [];
  const registrations = report?.registrations || [];
  const payments = report?.payments || [];
  const eventOptions = useMemo(() => report?.event_options || [], [report?.event_options]);

  const selectedEvent = useMemo(
    () => eventOptions.find((event) => String(event.id) === String(appliedFilters.event_id)),
    [appliedFilters.event_id, eventOptions],
  );

  const filterDescription = useMemo(() => {
    const parts = [];
    if (appliedFilters.from || appliedFilters.to) {
      const fromLabel = appliedFilters.from ? formatDate(appliedFilters.from) : 'earliest event';
      const toLabel = appliedFilters.to ? formatDate(appliedFilters.to) : 'latest event';
      parts.push(`${fromLabel} to ${toLabel}`);
    }
    if (selectedEvent) parts.push(selectedEvent.title);
    return parts.length ? parts.join(' · ') : 'All event dates and all events';
  }, [appliedFilters.from, appliedFilters.to, selectedEvent]);

  const hasActiveFilters = Boolean(appliedFilters.from || appliedFilters.to || appliedFilters.event_id);

  const handleSubmit = (event) => {
    event.preventDefault();
    loadReport(filters);
  };

  const resetFilters = () => {
    const empty = { from: '', to: '', event_id: '' };
    setFilters(empty);
    loadReport(empty);
  };

  const exportEvents = () => downloadCsv(
    'eventoplanners-event-report.csv',
    ['Event ID', 'Event', 'Venue', 'Date', 'Status', 'Capacity', 'Registrations', 'Confirmed', 'Pending payment', 'Cancelled', 'Fill rate %', 'Paid payment attempts', 'Paid amount USD'],
    events.map((event) => {
      const active = Number(event.confirmed_count || 0) + Number(event.pending_count || 0);
      const fillRate = Number(event.capacity || 0) > 0 ? ((active / Number(event.capacity)) * 100).toFixed(1) : '0.0';
      return [event.id, event.title, event.venue, String(event.event_date).slice(0, 10), event.status, event.capacity, event.registration_count, event.confirmed_count, event.pending_count, event.cancelled_count, fillRate, event.paid_payment_count, Number(event.paid_amount || 0).toFixed(2)];
    }),
  );

  const exportRegistrations = () => downloadCsv(
    'eventoplanners-registration-report.csv',
    ['Registration ID', 'Attendee', 'Email', 'Event', 'Event date', 'Registration status', 'Registration fee USD', 'Payment attempts', 'Paid payment attempts', 'Registered at'],
    registrations.map((registration) => [registration.id, registration.user_name, registration.user_email, registration.event_title, String(registration.event_date).slice(0, 10), registration.status, Number(registration.registration_fee || 0).toFixed(2), registration.payment_attempt_count, registration.paid_payment_count, registration.created_at]),
  );

  const exportPayments = () => downloadCsv(
    'eventoplanners-payment-report.csv',
    ['Payment ID', 'Registration ID', 'Attendee', 'Email', 'Event', 'Event date', 'Method', 'EventoPlanners reference', 'Provider/external reference', 'Amount USD', 'Status', 'Confirmed by', 'Confirmed at', 'Created at'],
    payments.map((payment) => [payment.id, payment.registration_id, payment.user_name, payment.user_email, payment.event_title, String(payment.event_date).slice(0, 10), paymentMethodLabel(payment.payment_method), payment.reference, payment.paynow_reference || payment.external_reference || '', Number(payment.amount || 0).toFixed(2), payment.status, payment.confirmed_by_name || '', payment.confirmed_at || '', payment.created_at]),
  );

  return (
    <AppShell role="admin">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="relative px-5 py-6 sm:px-7 sm:py-7">
            <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-indigo-100/80 blur-3xl dark:bg-indigo-500/10" />
            <div className="pointer-events-none absolute bottom-0 right-1/4 h-32 w-32 rounded-full bg-violet-100/60 blur-3xl dark:bg-violet-500/10" />
            <div className="relative max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Operational intelligence</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">Reports & performance</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                Review event demand, registration outcomes and payment activity from one consistent event-date filter, then export the exact report data you need.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-black text-slate-950 dark:text-white">Report filters</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Filters are applied by event date across events, registrations and payment attempts.</p>
            </div>
            {hasActiveFilters && (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                <FileBarChart size={13} /> Filtered report
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-[1fr_1fr_minmax(250px,1.4fr)_auto]">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              From event date
              <input
                type="date"
                value={filters.from}
                onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              To event date
              <input
                type="date"
                value={filters.to}
                onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Event
              <select
                value={filters.event_id}
                onChange={(event) => setFilters((current) => ({ ...current, event_id: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
              >
                <option value="">All events</option>
                {eventOptions.map((event) => (
                  <option key={event.id} value={event.id}>{event.title} — {String(event.event_date).slice(0, 10)}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-indigo-500/20"
              >
                <FileBarChart size={18} />
                {loading ? 'Generating...' : 'Generate report'}
              </button>
              <button
                type="button"
                onClick={resetFilters}
                disabled={loading}
                title="Reset filters"
                aria-label="Reset report filters"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-indigo-500/20"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-950/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Current report scope</p>
              <p className="mt-1 truncate font-semibold text-slate-700 dark:text-slate-200">{filterDescription}</p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                disabled={loading}
                className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-indigo-600 transition hover:text-indigo-700 disabled:opacity-50 dark:text-indigo-300 dark:hover:text-indigo-200"
              >
                <FilterX size={14} /> Clear applied filters
              </button>
            )}
          </div>
        </section>

        {error && (
          <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => loadReport(appliedFilters)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-500/20 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-500/10"
            >
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard icon={CalendarDays} label="Events in report" value={summary.events || 0} note="Events matching this scope" />
              <SummaryCard icon={Users} label="Registrations" value={summary.registrations || 0} note={`${summary.confirmed_registrations || 0} confirmed · ${summary.pending_registrations || 0} pending`} tone="violet" />
              <SummaryCard icon={TicketCheck} label="Payment attempts" value={summary.payment_attempts || 0} note={`${summary.paid_payments || 0} successful · ${summary.failed_payments || 0} failed`} tone="amber" />
              <SummaryCard icon={CircleDollarSign} label="Paid amount" value={formatMoney(summary.paid_amount)} note="Successful payment attempts" tone="green" />
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-500/20 dark:bg-green-500/10">
                <CheckCircle2 size={20} className="text-green-600 dark:text-green-300" />
                <div><p className="text-xs font-bold uppercase tracking-wide text-green-700/70 dark:text-green-300/70">Confirmed registrations</p><p className="mt-0.5 text-xl font-black text-green-800 dark:text-green-200">{summary.confirmed_registrations || 0}</p></div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                <Clock3 size={20} className="text-amber-600 dark:text-amber-300" />
                <div><p className="text-xs font-bold uppercase tracking-wide text-amber-700/70 dark:text-amber-300/70">Pending registrations</p><p className="mt-0.5 text-xl font-black text-amber-800 dark:text-amber-200">{summary.pending_registrations || 0}</p></div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <XCircle size={20} className="text-slate-500 dark:text-slate-400" />
                <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cancelled registrations</p><p className="mt-0.5 text-xl font-black text-slate-800 dark:text-slate-100">{summary.cancelled_registrations || 0}</p></div>
              </div>
            </section>

            <ReportSection
              title="Event performance"
              description="Registration load, capacity use and successful payment value per event."
              count={events.length}
              onExport={exportEvents}
              disabled={events.length === 0}
            >
              {events.length === 0 ? (
                <EmptyReport message="No events match these filters." />
              ) : (
                <>
                  <div className="space-y-3 p-4 md:hidden">
                    {events.map((event) => <EventMobileCard key={event.id} event={event} />)}
                  </div>
                  <div className="relative isolate hidden overflow-x-auto overscroll-x-contain md:block">
                    <table className="w-full min-w-[1180px] border-separate border-spacing-0 text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                        <tr>
                          <th className="sticky left-0 z-20 w-[260px] min-w-[260px] max-w-[260px] border-r border-slate-200 bg-slate-50 px-5 py-4 shadow-[6px_0_10px_-10px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950">Event</th>
                          <th className="px-5 py-4">Status</th>
                          <th className="px-5 py-4">Capacity</th>
                          <th className="px-5 py-4">Registrations</th>
                          <th className="px-5 py-4">Confirmed</th>
                          <th className="px-5 py-4">Pending</th>
                          <th className="px-5 py-4">Cancelled</th>
                          <th className="px-5 py-4">Fill rate</th>
                          <th className="px-5 py-4">Paid attempts</th>
                          <th className="px-5 py-4">Paid amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {events.map((event) => {
                          const active = Number(event.confirmed_count || 0) + Number(event.pending_count || 0);
                          const fillRate = Number(event.capacity || 0) > 0 ? ((active / Number(event.capacity)) * 100).toFixed(1) : '0.0';
                          return (
                            <tr key={event.id} className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                              <td className="sticky left-0 z-10 w-[260px] min-w-[260px] max-w-[260px] border-r border-slate-200 bg-white px-5 py-4 shadow-[6px_0_10px_-10px_rgba(15,23,42,0.35)] group-hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:group-hover:bg-slate-800">
                                <p className="font-bold text-slate-950 dark:text-white">{event.title}</p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{event.venue} · {formatDate(event.event_date)}</p>
                              </td>
                              <td className="px-5 py-4"><StatusBadge status={event.status} /></td>
                              <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">{event.capacity}</td>
                              <td className="px-5 py-4 font-bold text-slate-950 dark:text-white">{event.registration_count}</td>
                              <td className="px-5 py-4 text-green-700 dark:text-green-300">{event.confirmed_count}</td>
                              <td className="px-5 py-4 text-amber-700 dark:text-amber-300">{event.pending_count}</td>
                              <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{event.cancelled_count}</td>
                              <td className="px-5 py-4"><span className="font-bold text-slate-800 dark:text-slate-200">{fillRate}%</span><p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{active}/{event.capacity} active</p></td>
                              <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">{event.paid_payment_count}</td>
                              <td className="px-5 py-4 font-black text-green-700 dark:text-green-300">{formatMoney(event.paid_amount)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </ReportSection>

            <ReportSection
              title="Registration report"
              description="Attendee registrations associated with events in the selected report scope."
              count={registrations.length}
              onExport={exportRegistrations}
              disabled={registrations.length === 0}
            >
              {registrations.length === 0 ? (
                <EmptyReport message="No registrations match these filters." />
              ) : (
                <>
                  <div className="space-y-3 p-4 md:hidden">
                    {registrations.map((registration) => <RegistrationMobileCard key={registration.id} registration={registration} />)}
                  </div>
                  <div className="relative isolate hidden overflow-x-auto overscroll-x-contain md:block">
                    <table className="w-full min-w-[1120px] border-separate border-spacing-0 text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                        <tr>
                          <th className="sticky left-0 z-20 w-[240px] min-w-[240px] max-w-[240px] border-r border-slate-200 bg-slate-50 px-5 py-4 shadow-[6px_0_10px_-10px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950">Attendee</th>
                          <th className="px-5 py-4">Event</th>
                          <th className="px-5 py-4">Status</th>
                          <th className="px-5 py-4">Fee</th>
                          <th className="px-5 py-4">Payment attempts</th>
                          <th className="px-5 py-4">Paid attempts</th>
                          <th className="px-5 py-4">Registered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {registrations.map((registration) => (
                          <tr key={registration.id} className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                            <td className="sticky left-0 z-10 w-[240px] min-w-[240px] max-w-[240px] border-r border-slate-200 bg-white px-5 py-4 shadow-[6px_0_10px_-10px_rgba(15,23,42,0.35)] group-hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:group-hover:bg-slate-800">
                              <p className="font-bold text-slate-950 dark:text-white">{registration.user_name}</p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{registration.user_email}</p>
                              <p className="mt-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">Registration #{registration.id}</p>
                            </td>
                            <td className="px-5 py-4"><p className="font-semibold text-slate-900 dark:text-white">{registration.event_title}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(registration.event_date)}</p></td>
                            <td className="px-5 py-4"><StatusBadge status={registration.status} /></td>
                            <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">{formatMoney(registration.registration_fee)}</td>
                            <td className="px-5 py-4 font-bold text-slate-950 dark:text-white">{registration.payment_attempt_count}</td>
                            <td className="px-5 py-4 text-green-700 dark:text-green-300">{registration.paid_payment_count}</td>
                            <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{formatDateTime(registration.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </ReportSection>

            <ReportSection
              title="Payment report"
              description="Immutable payment-attempt history linked to registrations for the selected events."
              count={payments.length}
              onExport={exportPayments}
              disabled={payments.length === 0}
            >
              {payments.length === 0 ? (
                <EmptyReport message="No payment attempts match these filters." />
              ) : (
                <>
                  <div className="space-y-3 p-4 md:hidden">
                    {payments.map((payment) => <PaymentMobileCard key={payment.id} payment={payment} />)}
                  </div>
                  <div className="relative isolate hidden overflow-x-auto overscroll-x-contain md:block">
                    <table className="w-full min-w-[1260px] border-separate border-spacing-0 text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                        <tr>
                          <th className="sticky left-0 z-20 w-[240px] min-w-[240px] max-w-[240px] border-r border-slate-200 bg-slate-50 px-5 py-4 shadow-[6px_0_10px_-10px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950">Attendee</th>
                          <th className="px-5 py-4">Event</th>
                          <th className="px-5 py-4">Method</th>
                          <th className="px-5 py-4">Reference</th>
                          <th className="px-5 py-4">Provider / external</th>
                          <th className="px-5 py-4">Amount</th>
                          <th className="px-5 py-4">Status</th>
                          <th className="px-5 py-4">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {payments.map((payment) => (
                          <tr key={payment.id} className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                            <td className="sticky left-0 z-10 w-[240px] min-w-[240px] max-w-[240px] border-r border-slate-200 bg-white px-5 py-4 shadow-[6px_0_10px_-10px_rgba(15,23,42,0.35)] group-hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:group-hover:bg-slate-800">
                              <p className="font-bold text-slate-950 dark:text-white">{payment.user_name}</p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{payment.user_email}</p>
                              <p className="mt-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">Registration #{payment.registration_id}</p>
                            </td>
                            <td className="px-5 py-4"><p className="font-semibold text-slate-900 dark:text-white">{payment.event_title}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(payment.event_date)}</p></td>
                            <td className="px-5 py-4 text-xs font-bold text-slate-700 dark:text-slate-200">{paymentMethodLabel(payment.payment_method)}</td>
                            <td className="max-w-[220px] break-all px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">{payment.reference}</td>
                            <td className="max-w-[190px] break-all px-5 py-4 text-xs text-slate-500 dark:text-slate-400">{payment.paynow_reference || payment.external_reference || '—'}</td>
                            <td className="px-5 py-4 font-black text-slate-950 dark:text-white">{formatMoney(payment.amount)}</td>
                            <td className="px-5 py-4"><StatusBadge status={payment.status} /></td>
                            <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{formatDateTime(payment.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </ReportSection>
          </>
        )}
      </div>
    </AppShell>
  );
}
