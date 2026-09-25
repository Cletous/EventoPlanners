import { ChevronLeft, CircleDollarSign, RefreshCw, Search, TicketCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import api from '../services/api';

function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function statusClass(status) {
  if (status === 'paid') return 'bg-green-50 text-green-700';
  if (status === 'failed') return 'bg-red-50 text-red-700';
  return 'bg-amber-50 text-amber-700';
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadPayments = async (nextSearch = search, nextStatus = status) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (nextSearch.trim()) params.search = nextSearch.trim();
      if (nextStatus) params.status = nextStatus;
      const response = await api.get('/admin/payments', { params });
      setPayments(response.data.payments || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPayments('', ''); }, []);

  const checkPayment = async (payment) => {
    setChecking(payment.reference);
    setError('');
    setMessage('');
    try {
      const response = await api.post(`/admin/payments/${encodeURIComponent(payment.reference)}/check`);
      setMessage(response.data.message || 'Payment status checked.');
      await loadPayments();
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
    paidAmount: payments.filter((payment) => payment.status === 'paid').reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
  }), [payments]);

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    loadPayments('', '');
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4"><Logo compact /><Link to="/admin/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ChevronLeft size={17} /> Dashboard</Link></div></header>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-700"><CircleDollarSign size={16} /> Payments</span><h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">Payment attempts</h1><p className="mt-2 text-slate-500">Search payment history, filter by status, and manually check pending Paynow attempts.</p></div>
          <Link to="/admin/registrations" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"><TicketCheck size={18} /> View registrations</Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><CircleDollarSign className="text-green-600" size={21} /><p className="mt-3 text-2xl font-bold text-slate-950">US${totals.paidAmount.toFixed(2)}</p><p className="text-sm text-slate-500">Paid amount shown</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-2xl font-bold text-slate-950">{totals.paid}</p><p className="mt-1 text-sm text-slate-500">Paid attempts</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-2xl font-bold text-slate-950">{totals.pending}</p><p className="mt-1 text-sm text-slate-500">Pending attempts</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-2xl font-bold text-slate-950">{totals.failed}</p><p className="mt-1 text-sm text-slate-500">Failed attempts</p></div>
        </div>

        {message && <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</div>}
        {error && <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <form onSubmit={(event) => { event.preventDefault(); loadPayments(); }} className="grid gap-3 border-b border-slate-100 p-5 md:grid-cols-[1fr_200px_auto_auto]">
            <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search attendee, event or payment reference" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" /></div>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"><option value="">All statuses</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option></select>
            <button type="submit" className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800">Apply</button>
            {(search || status) && <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">Clear</button>}
          </form>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No payment attempts match the current filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1120px] w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Attendee</th><th className="px-5 py-4">Event</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Reference</th><th className="px-5 py-4">Registration</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Created</th><th className="px-5 py-4">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="align-top hover:bg-slate-50/70">
                      <td className="px-5 py-4"><p className="font-semibold text-slate-900">{payment.user_name}</p><p className="mt-1 text-xs text-slate-500">{payment.user_email}</p></td>
                      <td className="px-5 py-4"><p className="font-medium text-slate-800">{payment.event_title}</p><p className="mt-1 text-xs text-slate-500">{formatDateTime(payment.event_date)}</p></td>
                      <td className="px-5 py-4 font-semibold">US${Number(payment.amount).toFixed(2)}</td>
                      <td className="max-w-xs px-5 py-4"><p className="break-all font-mono text-xs text-slate-600">{payment.reference}</p>{payment.paynow_reference && <p className="mt-1 break-all text-xs text-slate-400">Paynow: {payment.paynow_reference}</p>}</td>
                      <td className="px-5 py-4"><p className="text-xs font-semibold text-slate-700">#{payment.registration_id}</p><p className="mt-1 text-xs capitalize text-slate-500">{String(payment.registration_status).replace('_', ' ')}</p></td>
                      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClass(payment.status)}`}>{payment.status}</span></td>
                      <td className="px-5 py-4 text-slate-500">{formatDateTime(payment.created_at)}</td>
                      <td className="px-5 py-4">{payment.status !== 'paid' && Boolean(Number(payment.can_poll)) ? <button type="button" onClick={() => checkPayment(payment)} disabled={checking !== null} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"><RefreshCw size={16} className={checking === payment.reference ? 'animate-spin' : ''} /> {checking === payment.reference ? 'Checking...' : 'Check Paynow'}</button> : payment.status === 'paid' ? <span className="text-xs font-semibold text-green-700">Confirmed</span> : <span className="text-xs text-slate-400">No poll URL</span>}</td>
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
