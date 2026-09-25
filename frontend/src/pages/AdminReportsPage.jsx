import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Download,
  FileBarChart,
  RefreshCw,
  TicketCheck,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
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

function statusClass(status) {
  if (status === 'paid' || status === 'confirmed' || status === 'published') return 'bg-green-50 text-green-700';
  if (status === 'pending' || status === 'pending_payment' || status === 'draft') return 'bg-amber-50 text-amber-700';
  if (status === 'failed') return 'bg-red-50 text-red-700';
  return 'bg-slate-100 text-slate-600';
}

function statusLabel(status) {
  if (status === 'pending_payment') return 'Pending payment';
  return String(status || 'unknown').replaceAll('_', ' ');
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

function SummaryCard({ icon, label, value, note }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
          {note && <p className="mt-2 text-xs text-slate-500">{note}</p>}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">{icon}</div>
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const [filters, setFilters] = useState({ from: '', to: '', event_id: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = async (nextFilters = filters) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (nextFilters.from) params.from = nextFilters.from;
      if (nextFilters.to) params.to = nextFilters.to;
      if (nextFilters.event_id) params.event_id = nextFilters.event_id;
      const response = await api.get('/admin/reports', { params });
      setReport(response.data.report);
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
  const eventOptions = report?.event_options || [];

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
    ['Payment ID', 'Registration ID', 'Attendee', 'Email', 'Event', 'Event date', 'EventoPlanners reference', 'Paynow reference', 'Amount USD', 'Status', 'Created at'],
    payments.map((payment) => [payment.id, payment.registration_id, payment.user_name, payment.user_email, payment.event_title, String(payment.event_date).slice(0, 10), payment.reference, payment.paynow_reference || '', Number(payment.amount || 0).toFixed(2), payment.status, payment.created_at]),
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Logo compact />
          <Link to="/admin/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft size={17} /> Dashboard</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><FileBarChart size={24} /></div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">Reports</h1>
          <p className="mt-2 max-w-3xl text-slate-500">Generate operational reports from the current EventoPlanners database. Filters use the event date so the same range is applied consistently to event, registration and payment results.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            <label className="text-sm font-semibold text-slate-700">From event date
              <input type="date" value={filters.from} onChange={(e) => setFilters((current) => ({ ...current, from: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" />
            </label>
            <label className="text-sm font-semibold text-slate-700">To event date
              <input type="date" value={filters.to} onChange={(e) => setFilters((current) => ({ ...current, to: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" />
            </label>
            <label className="text-sm font-semibold text-slate-700">Event
              <select value={filters.event_id} onChange={(e) => setFilters((current) => ({ ...current, event_id: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100">
                <option value="">All events</option>
                {eventOptions.map((event) => <option key={event.id} value={event.id}>{event.title} — {String(event.event_date).slice(0, 10)}</option>)}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={loading} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"><FileBarChart size={18} /> Generate</button>
              <button type="button" onClick={resetFilters} disabled={loading} title="Reset filters" className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={18} /></button>
            </div>
          </div>
        </form>

        {error && <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

        {loading ? (
          <div className="mt-7 flex min-h-48 items-center justify-center rounded-3xl border border-slate-200 bg-white"><div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>
        ) : (
          <>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard icon={<CalendarDays size={21} />} label="Events in report" value={summary.events || 0} note="Events matching the selected filters" />
              <SummaryCard icon={<Users size={21} />} label="Registrations" value={summary.registrations || 0} note={`${summary.confirmed_registrations || 0} confirmed`} />
              <SummaryCard icon={<TicketCheck size={21} />} label="Payment attempts" value={summary.payment_attempts || 0} note={`${summary.paid_payments || 0} successful`} />
              <SummaryCard icon={<CircleDollarSign size={21} />} label="Paid amount" value={formatMoney(summary.paid_amount)} note="Sum of successful payment attempts" />
            </div>

            <section className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div><h2 className="font-bold text-slate-950">Event performance report</h2><p className="mt-1 text-sm text-slate-500">Registration load, capacity use and successful payment value per event.</p></div>
                <button type="button" onClick={exportEvents} disabled={events.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"><Download size={16} /> Download CSV</button>
              </div>
              {events.length === 0 ? <p className="p-6 text-sm text-slate-500">No events match these filters.</p> : (
                <div className="overflow-x-auto"><table className="w-full min-w-[1150px] text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Event</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Capacity</th><th className="px-5 py-4">Registrations</th><th className="px-5 py-4">Confirmed</th><th className="px-5 py-4">Pending</th><th className="px-5 py-4">Cancelled</th><th className="px-5 py-4">Fill rate</th><th className="px-5 py-4">Paid amount</th></tr></thead><tbody className="divide-y divide-slate-100">
                  {events.map((event) => {
                    const active = Number(event.confirmed_count || 0) + Number(event.pending_count || 0);
                    const fillRate = Number(event.capacity || 0) > 0 ? ((active / Number(event.capacity)) * 100).toFixed(1) : '0.0';
                    return <tr key={event.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{event.title}</p><p className="mt-1 text-xs text-slate-500">{event.venue} · {formatDate(event.event_date)}</p></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClass(event.status)}`}>{statusLabel(event.status)}</span></td><td className="px-5 py-4">{event.capacity}</td><td className="px-5 py-4 font-semibold">{event.registration_count}</td><td className="px-5 py-4">{event.confirmed_count}</td><td className="px-5 py-4">{event.pending_count}</td><td className="px-5 py-4">{event.cancelled_count}</td><td className="px-5 py-4">{fillRate}%</td><td className="px-5 py-4 font-semibold text-green-700">{formatMoney(event.paid_amount)}</td></tr>;
                  })}
                </tbody></table></div>
              )}
            </section>

            <section className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-950">Registration report</h2><p className="mt-1 text-sm text-slate-500">Attendee registrations for the selected event-date range.</p></div><button type="button" onClick={exportRegistrations} disabled={registrations.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"><Download size={16} /> Download CSV</button></div>
              {registrations.length === 0 ? <p className="p-6 text-sm text-slate-500">No registrations match these filters.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Attendee</th><th className="px-5 py-4">Event</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Fee</th><th className="px-5 py-4">Payment attempts</th><th className="px-5 py-4">Registered</th></tr></thead><tbody className="divide-y divide-slate-100">{registrations.map((registration) => <tr key={registration.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{registration.user_name}</p><p className="mt-1 text-xs text-slate-500">{registration.user_email}</p></td><td className="px-5 py-4"><p className="font-semibold text-slate-900">{registration.event_title}</p><p className="mt-1 text-xs text-slate-500">{formatDate(registration.event_date)}</p></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClass(registration.status)}`}>{statusLabel(registration.status)}</span></td><td className="px-5 py-4">{formatMoney(registration.registration_fee)}</td><td className="px-5 py-4">{registration.payment_attempt_count} <span className="text-xs text-slate-400">({registration.paid_payment_count} paid)</span></td><td className="px-5 py-4 text-slate-500">{formatDate(registration.created_at)}</td></tr>)}</tbody></table></div>}
            </section>

            <section className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-950">Payment report</h2><p className="mt-1 text-sm text-slate-500">Immutable payment-attempt history linked to the selected events.</p></div><button type="button" onClick={exportPayments} disabled={payments.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"><Download size={16} /> Download CSV</button></div>
              {payments.length === 0 ? <p className="p-6 text-sm text-slate-500">No payment attempts match these filters.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[1200px] text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Attendee</th><th className="px-5 py-4">Event</th><th className="px-5 py-4">Reference</th><th className="px-5 py-4">Paynow reference</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Created</th></tr></thead><tbody className="divide-y divide-slate-100">{payments.map((payment) => <tr key={payment.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{payment.user_name}</p><p className="mt-1 text-xs text-slate-500">{payment.user_email}</p></td><td className="px-5 py-4"><p className="font-semibold text-slate-900">{payment.event_title}</p><p className="mt-1 text-xs text-slate-500">{formatDate(payment.event_date)}</p></td><td className="px-5 py-4 break-all font-mono text-xs text-slate-600">{payment.reference}</td><td className="px-5 py-4 break-all text-xs text-slate-500">{payment.paynow_reference || '—'}</td><td className="px-5 py-4 font-semibold">{formatMoney(payment.amount)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClass(payment.status)}`}>{statusLabel(payment.status)}</span></td><td className="px-5 py-4 text-slate-500">{formatDate(payment.created_at)}</td></tr>)}</tbody></table></div>}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
