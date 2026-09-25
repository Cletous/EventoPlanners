import {
  CalendarDays,
  ChevronLeft,
  CircleDollarSign,
  CreditCard,
  MapPin,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import Logo from '../components/Logo';
import api from '../services/api';

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(new Date(`${String(value).slice(0, 10)}T00:00:00`));
}

function statusClass(status) {
  if (status === 'confirmed') return 'bg-green-50 text-green-700';
  if (status === 'pending_payment') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

function statusLabel(status) {
  return status === 'pending_payment' ? 'Pending payment' : status.charAt(0).toUpperCase() + status.slice(1);
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

  const loadRegistrations = async () => {
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
  };

  useEffect(() => { loadRegistrations(); }, []);

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

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4"><Logo compact /><Link to="/user/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ChevronLeft size={17} /> Dashboard</Link></div></header>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700"><CalendarDays size={16} /> My registrations</span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">Your event registrations</h1>
        <p className="mt-2 text-slate-500">View registrations, pay with Paynow, and ask Paynow directly for the latest payment status.</p>

        {message && <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</div>}
        {error && <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

        {loading ? <div className="flex min-h-72 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div> : registrations.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"><CalendarDays className="mx-auto text-slate-300" size={46} /><h2 className="mt-4 text-xl font-bold text-slate-900">No registrations yet</h2><p className="mt-2 text-slate-500">Browse published events and register for one to see it here.</p><Link to="/user/events" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">Browse events</Link></div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {registrations.map((registration) => {
              const hasPayment = Boolean(registration.latest_payment_reference);
              const canPoll = Boolean(Number(registration.latest_payment_pollable));
              const paymentPending = registration.latest_payment_status === 'pending';

              return (
                <article key={registration.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4"><div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(registration.status)}`}>{statusLabel(registration.status)}</span><h2 className="mt-3 text-xl font-bold text-slate-950">{registration.title}</h2></div><span className="text-xs font-semibold text-slate-400">#{registration.id}</span></div>
                  <div className="mt-5 space-y-2.5 text-sm text-slate-600"><p className="flex items-center gap-2"><MapPin size={16} className="text-indigo-500" /> {registration.venue}</p><p className="flex items-center gap-2"><CalendarDays size={16} className="text-indigo-500" /> {formatDate(registration.event_date)} at {String(registration.start_time).slice(0, 5)}</p><p className="flex items-center gap-2"><CircleDollarSign size={16} className="text-indigo-500" /> {Number(registration.registration_fee) === 0 ? 'Free' : `US$${Number(registration.registration_fee).toFixed(2)}`}</p></div>

                  {registration.status === 'pending_payment' && (
                    <div className="mt-6 space-y-3">
                      {hasPayment && paymentPending && canPoll && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => checkPayment(registration)}
                            disabled={checkingReference !== null || payingId !== null}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <RefreshCw size={18} className={checkingReference === registration.latest_payment_reference ? 'animate-spin' : ''} />
                            {checkingReference === registration.latest_payment_reference ? 'Checking Paynow...' : 'Check payment status'}
                          </button>
                          <button
                            type="button"
                            onClick={() => startPayment(registration)}
                            disabled={payingId !== null || checkingReference !== null}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <CreditCard size={18} />
                            {payingId === registration.id ? 'Opening Paynow...' : 'Make a new payment'}
                          </button>
                        </div>
                      )}

                      {hasPayment && paymentPending && !canPoll && (
                        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">This older payment attempt has no saved Paynow poll URL. Start a new payment attempt to enable status checking.</p>
                      )}

                      {(!paymentPending || !canPoll) && (
                        <button
                          type="button"
                          onClick={() => startPayment(registration)}
                          disabled={payingId !== null || checkingReference !== null}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CreditCard size={18} />
                          {payingId === registration.id ? 'Opening Paynow...' : hasPayment ? 'Start new Paynow payment' : 'Pay with Paynow'}
                        </button>
                      )}

                      <button type="button" onClick={() => setCancelTarget(registration)} disabled={payingId !== null || checkingReference !== null} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"><XCircle size={18} /> Cancel unpaid registration</button>
                    </div>
                  )}

                  {registration.status === 'confirmed' && <p className="mt-6 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-700">Your place is confirmed.</p>}
                  {registration.status === 'cancelled' && <p className="mt-6 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">This registration was cancelled. You may register again while the event is published and has capacity.</p>}
                </article>
              );
            })}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel registration?"
        message={cancelTarget ? `Cancel your unpaid registration for “${cancelTarget.title}”? You can register again later if places remain.` : ''}
        confirmLabel="Cancel registration"
        busy={submitting}
        onConfirm={cancelRegistration}
        onCancel={() => !submitting && setCancelTarget(null)}
        danger
      />
    </main>
  );
}

