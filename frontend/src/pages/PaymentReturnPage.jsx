import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import api from '../services/api';

function statusPresentation(status) {
  if (status === 'paid') {
    return {
      icon: CheckCircle2,
      eyebrow: 'Payment successful',
      title: 'Your place is confirmed',
      text: 'Paynow confirmed your payment and EventoPlanners has confirmed your event registration.',
      panel: 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10',
      iconClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
      textClass: 'text-emerald-900 dark:text-emerald-100',
      mutedClass: 'text-emerald-700 dark:text-emerald-300',
    };
  }

  if (status === 'failed') {
    return {
      icon: XCircle,
      eyebrow: 'Payment unsuccessful',
      title: 'This payment was not completed',
      text: 'Paynow reports that this payment attempt was unsuccessful. Your registration remains unconfirmed until a payment succeeds.',
      panel: 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10',
      iconClass: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300',
      textClass: 'text-red-900 dark:text-red-100',
      mutedClass: 'text-red-700 dark:text-red-300',
    };
  }

  return {
    icon: Clock3,
    eyebrow: 'Awaiting confirmation',
    title: 'Payment status is still pending',
    text: 'If you have just completed the Paynow checkout, the status may take a moment to update. You can ask Paynow for the latest status below.',
    panel: 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10',
    iconClass: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    textClass: 'text-amber-900 dark:text-amber-100',
    mutedClass: 'text-amber-700 dark:text-amber-300',
  };
}

export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference') || '';
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const checkPayment = useCallback(async (manual = false) => {
    if (!reference) {
      setError('The payment reference is missing from the return URL.');
      setLoading(false);
      return;
    }

    if (manual) setRefreshing(true);

    try {
      const response = await api.post(`/payments/${encodeURIComponent(reference)}/check`);
      setPayment(response.data.payment);
      setError('');
    } catch (requestError) {
      try {
        const localResponse = await api.get(`/payments/${encodeURIComponent(reference)}`);
        setPayment(localResponse.data.payment);
      } catch (localError) {
        void localError;
      }

      setError(requestError.response?.data?.message || 'Unable to check the payment with Paynow.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [reference]);

  useEffect(() => {
    checkPayment();
  }, [checkPayment]);

  const presentation = statusPresentation(payment?.status);
  const StatusIcon = presentation.icon;

  return (
    <AppShell role="user">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/user/registrations"
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300"
        >
          <ArrowLeft size={17} /> Back to My registrations
        </Link>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-6 py-5 dark:border-slate-800 dark:from-indigo-500/10 dark:via-slate-900 dark:to-violet-500/10 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
                  <CircleDollarSign size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Paynow payment</p>
                  <h1 className="mt-0.5 text-lg font-black text-slate-950 dark:text-white">Payment confirmation</h1>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-400">
                <ShieldCheck size={15} className="text-indigo-500 dark:text-indigo-300" /> Secure status check
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {loading ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center" aria-live="polite">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600 dark:border-slate-800 dark:border-t-indigo-400" />
                <h2 className="mt-5 text-xl font-black text-slate-950 dark:text-white">Checking payment status</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">EventoPlanners is asking Paynow for the latest information about this payment attempt.</p>
              </div>
            ) : !payment ? (
              <div className="py-10 text-center sm:py-14">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                  <AlertCircle size={30} />
                </div>
                <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Unable to load this payment</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">{error || 'The payment could not be loaded.'}</p>
                <Link to="/user/registrations" className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700">
                  <ArrowLeft size={17} /> Return to registrations
                </Link>
              </div>
            ) : (
              <>
                <div className={`rounded-3xl border p-6 sm:p-7 ${presentation.panel}`}>
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${presentation.iconClass}`}>
                      <StatusIcon size={29} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-black uppercase tracking-[0.13em] ${presentation.mutedClass}`}>{presentation.eyebrow}</p>
                      <h2 className={`mt-2 text-2xl font-black tracking-tight sm:text-3xl ${presentation.textClass}`}>{presentation.title}</h2>
                      <p className={`mt-3 max-w-2xl text-sm leading-6 ${presentation.mutedClass}`}>{presentation.text}</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                    <AlertCircle className="mt-0.5 shrink-0" size={18} />
                    <div><p className="font-bold">Live Paynow check was unavailable</p><p className="mt-0.5 text-amber-700 dark:text-amber-300">{error} The locally saved payment information is shown below.</p></div>
                  </div>
                )}

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Event</p>
                    <p className="mt-1.5 font-bold text-slate-900 dark:text-white">{payment.title || 'Event'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Amount</p>
                    <p className="mt-1.5 text-lg font-black text-slate-900 dark:text-white">US${Number(payment.amount || 0).toFixed(2)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Paynow reference</p>
                    <p className="mt-1.5 break-all font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">{payment.reference}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Current status</p>
                    <div className="mt-1.5 flex items-center gap-2 font-bold capitalize text-slate-900 dark:text-white"><CreditCard size={17} className="text-indigo-500 dark:text-indigo-300" /> {payment.status || 'unknown'}</div>
                  </div>
                </div>

                <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-6 dark:border-slate-800 sm:flex-row">
                  {payment.status !== 'paid' && payment.can_poll && (
                    <button
                      type="button"
                      onClick={() => checkPayment(true)}
                      disabled={refreshing}
                      className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-indigo-500/20"
                    >
                      <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                      {refreshing ? 'Checking Paynow...' : 'Check Paynow again'}
                    </button>
                  )}
                  <Link
                    to="/user/registrations"
                    className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-indigo-500/20"
                  >
                    <ArrowLeft size={18} /> Back to registrations
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
