import {
  CalendarDays,
  ChevronLeft,
  CircleDollarSign,
  RefreshCw,
  Search,
  TicketCheck,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import api from '../services/api';

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(
    new Date(`${String(value).slice(0, 10)}T00:00:00`),
  );
}

function registrationStatusClass(status) {
  if (status === 'confirmed') return 'bg-green-50 text-green-700';
  if (status === 'pending_payment') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

function paymentStatusClass(status) {
  if (status === 'paid') return 'bg-green-50 text-green-700';
  if (status === 'failed') return 'bg-red-50 text-red-700';
  if (status === 'pending') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-500';
}

function registrationStatusLabel(status) {
  if (status === 'pending_payment') return 'Pending payment';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRegistrations = async (nextSearch = search, nextStatus = status) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (nextSearch.trim()) params.search = nextSearch.trim();
      if (nextStatus) params.status = nextStatus;
      const response = await api.get('/admin/registrations', { params });
      setRegistrations(response.data.registrations || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRegistrations('', ''); }, []);

  const totals = useMemo(() => ({
    confirmed: registrations.filter((item) => item.status === 'confirmed').length,
    pending: registrations.filter((item) => item.status === 'pending_payment').length,
    cancelled: registrations.filter((item) => item.status === 'cancelled').length,
  }), [registrations]);

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    loadRegistrations('', '');
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Logo compact />
          <Link to="/admin/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ChevronLeft size={17} /> Dashboard</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700"><TicketCheck size={16} /> Registrations</span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">Attendee registrations</h1>
            <p className="mt-2 text-slate-500">Review attendee registrations, registration status, and latest payment information.</p>
          </div>
          <Link to="/admin/payments" className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700"><CircleDollarSign size={18} /> View payment attempts</Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><UserRound className="text-indigo-600" size={21} /><p className="mt-3 text-2xl font-bold text-slate-950">{registrations.length}</p><p className="text-sm text-slate-500">Registrations shown</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><TicketCheck className="text-green-600" size={21} /><p className="mt-3 text-2xl font-bold text-slate-950">{totals.confirmed}</p><p className="text-sm text-slate-500">Confirmed</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><CircleDollarSign className="text-amber-600" size={21} /><p className="mt-3 text-2xl font-bold text-slate-950">{totals.pending}</p><p className="text-sm text-slate-500">Pending payment</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><RefreshCw className="text-slate-500" size={21} /><p className="mt-3 text-2xl font-bold text-slate-950">{totals.cancelled}</p><p className="text-sm text-slate-500">Cancelled</p></div>
        </div>

        {error && <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <form onSubmit={(event) => { event.preventDefault(); loadRegistrations(); }} className="grid gap-3 border-b border-slate-100 p-5 md:grid-cols-[1fr_220px_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search attendee, email, event or venue" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" />
            </div>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100">
              <option value="">All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending_payment">Pending payment</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button type="submit" className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800">Apply</button>
            {(search || status) && <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">Clear</button>}
          </form>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>
          ) : registrations.length === 0 ? (
            <div className="px-6 py-16 text-center"><TicketCheck className="mx-auto text-slate-300" size={44} /><h2 className="mt-4 text-lg font-bold text-slate-900">No registrations found</h2><p className="mt-1 text-slate-500">Try changing the search or status filter.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr><th className="px-5 py-4">Attendee</th><th className="px-5 py-4">Event</th><th className="px-5 py-4">Registration</th><th className="px-5 py-4">Payment attempts</th><th className="px-5 py-4">Latest payment</th><th className="px-5 py-4">Registered</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registrations.map((registration) => (
                    <tr key={registration.id} className="align-top hover:bg-slate-50/70">
                      <td className="px-5 py-4"><p className="font-semibold text-slate-900">{registration.user_name}</p><p className="mt-1 text-xs text-slate-500">{registration.user_email}</p><p className="mt-1 text-xs text-slate-400">User #{registration.user_id}</p></td>
                      <td className="px-5 py-4"><p className="font-semibold text-slate-900">{registration.event_title}</p><p className="mt-1 text-xs text-slate-500">{registration.event_venue}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><CalendarDays size={13} /> {formatDate(registration.event_date)} at {String(registration.start_time).slice(0, 5)}</p></td>
                      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${registrationStatusClass(registration.status)}`}>{registrationStatusLabel(registration.status)}</span><p className="mt-2 text-xs text-slate-400">Registration #{registration.id}</p></td>
                      <td className="px-5 py-4"><p className="font-semibold text-slate-800">{Number(registration.payment_attempt_count || 0)}</p><p className="mt-1 text-xs text-slate-500">{Number(registration.paid_payment_count || 0)} paid</p></td>
                      <td className="px-5 py-4">
                        {registration.latest_payment_reference ? (
                          <div><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${paymentStatusClass(registration.latest_payment_status)}`}>{registration.latest_payment_status}</span><p className="mt-2 break-all font-mono text-xs text-slate-500">{registration.latest_payment_reference}</p>{registration.latest_paynow_reference && <p className="mt-1 text-xs text-slate-400">Paynow: {registration.latest_paynow_reference}</p>}</div>
                        ) : <span className="text-xs text-slate-400">No payment attempts</span>}
                      </td>
                      <td className="px-5 py-4 text-slate-500">{formatDate(registration.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
