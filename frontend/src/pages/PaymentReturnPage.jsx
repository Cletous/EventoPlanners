import {
  CheckCircle2,
  ChevronLeft,
  CircleDollarSign,
  Clock3,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';
import api from '../services/api';

function statusPresentation(status) {
  if (status === 'paid') {
    return {
      icon: <CheckCircle2 size={48} className="text-green-600" />,
      title: 'Payment confirmed',
      text: 'Paynow confirmed your payment and your event registration is now confirmed.',
      box: 'border-green-100 bg-green-50 text-green-700',
    };
  }

  if (status === 'failed') {
    return {
      icon: <XCircle size={48} className="text-red-600" />,
      title: 'Payment was not completed',
      text: 'This payment attempt was not successful. Your registration remains available for another payment attempt.',
      box: 'border-red-100 bg-red-50 text-red-700',
    };
  }

  return {
    icon: <Clock3 size={48} className="text-amber-500" />,
    title: 'Waiting for payment confirmation',
    text: 'We are waiting for Paynow to send the final transaction result. This page refreshes the status automatically.',
    box: 'border-amber-100 bg-amber-50 text-amber-700',
  };
}

export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference') || '';
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadPayment = useCallback(async (manual = false) => {
    if (!reference) {
      setError('The payment reference is missing from the return URL.');
      setLoading(false);
      return;
    }

    if (manual) setRefreshing(true);

    try {
      const response = await api.get(`/payments/${encodeURIComponent(reference)}`);
      setPayment(response.data.payment);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load the payment status.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [reference]);

  useEffect(() => {
    loadPayment();
  }, [loadPayment]);

  useEffect(() => {
    if (!payment || payment.status !== 'pending') return undefined;

    const interval = window.setInterval(() => loadPayment(), 3000);
    return () => window.clearInterval(interval);
  }, [payment, loadPayment]);

  const presentation = statusPresentation(payment?.status);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
          <Logo compact />
          <Link to="/user/registrations" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <ChevronLeft size={17} /> My registrations
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-indigo-600">
            <CircleDollarSign size={18} /> Paynow payment
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            </div>
          ) : error ? (
            <div className="mt-7 rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">
              <h1 className="text-xl font-bold">Unable to check payment</h1>
              <p className="mt-2 text-sm">{error}</p>
            </div>
          ) : (
            <>
              <div className="mt-7 flex flex-col items-center text-center">
                {presentation.icon}
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{presentation.title}</h1>
                <p className="mt-3 max-w-xl leading-7 text-slate-500">{presentation.text}</p>
              </div>

              <div className={`mt-7 rounded-2xl border p-5 ${presentation.box}`}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><p className="text-xs font-bold uppercase tracking-wide opacity-70">Event</p><p className="mt-1 font-semibold">{payment.title}</p></div>
                  <div><p className="text-xs font-bold uppercase tracking-wide opacity-70">Amount</p><p className="mt-1 font-semibold">US${Number(payment.amount).toFixed(2)}</p></div>
                  <div><p className="text-xs font-bold uppercase tracking-wide opacity-70">Reference</p><p className="mt-1 break-all font-mono text-sm">{payment.reference}</p></div>
                  <div><p className="text-xs font-bold uppercase tracking-wide opacity-70">Status</p><p className="mt-1 font-semibold capitalize">{payment.status}</p></div>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                {payment.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => loadPayment(true)}
                    disabled={refreshing}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'Checking...' : 'Check again'}
                  </button>
                )}
                <Link to="/user/registrations" className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">
                  Back to registrations
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
