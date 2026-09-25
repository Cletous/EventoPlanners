import { ChevronLeft, CircleDollarSign, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/payments');
      setPayments(response.data.payments || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPayments(); }, []);

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

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4"><Logo compact /><Link to="/admin/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ChevronLeft size={17} /> Dashboard</Link></div></header>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-700"><CircleDollarSign size={16} /> Payment status</span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">Paynow payments</h1>
        <p className="mt-2 text-slate-500">Review payment attempts and manually ask Paynow for the latest status.</p>

        {message && <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</div>}
        {error && <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

        {loading ? (
          <div className="flex min-h-72 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>
        ) : payments.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">No payment attempts have been created yet.</div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Attendee</th><th className="px-5 py-4">Event</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Reference</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Created</th><th className="px-5 py-4">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="align-top">
                    <td className="px-5 py-4"><p className="font-semibold text-slate-900">{payment.user_name}</p><p className="mt-1 text-xs text-slate-500">{payment.user_email}</p></td>
                    <td className="px-5 py-4 font-medium text-slate-800">{payment.event_title}</td>
                    <td className="px-5 py-4 font-semibold">US${Number(payment.amount).toFixed(2)}</td>
                    <td className="max-w-xs px-5 py-4"><p className="break-all font-mono text-xs text-slate-600">{payment.reference}</p>{payment.paynow_reference && <p className="mt-1 text-xs text-slate-400">Paynow: {payment.paynow_reference}</p>}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClass(payment.status)}`}>{payment.status}</span></td>
                    <td className="px-5 py-4 text-slate-500">{formatDateTime(payment.created_at)}</td>
                    <td className="px-5 py-4">
                      {payment.status !== 'paid' && Boolean(Number(payment.can_poll)) ? (
                        <button type="button" onClick={() => checkPayment(payment)} disabled={checking !== null} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"><RefreshCw size={16} className={checking === payment.reference ? 'animate-spin' : ''} /> {checking === payment.reference ? 'Checking...' : 'Check Paynow'}</button>
                      ) : payment.status === 'paid' ? (
                        <span className="text-xs font-semibold text-green-700">Confirmed</span>
                      ) : (
                        <span className="text-xs text-slate-400">No poll URL</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
