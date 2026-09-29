import { Banknote, Building2, CheckCircle2, LoaderCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import api from '../services/api';

function formatMoney(value) {
  return `US$${Number(value || 0).toFixed(2)}`;
}

export default function OfflinePaymentModal({ open, registration, onClose, onConfirmed }) {
  const [method, setMethod] = useState('bank_transfer');
  const [externalReference, setExternalReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const referenceRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    setMethod('bank_transfer');
    setExternalReference('');
    setNotes('');
    setError('');
    setSubmitting(false);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => referenceRef.current?.focus(), 0);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current?.();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!open || !registration) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (method === 'bank_transfer' && !externalReference.trim()) {
      setError('Enter the bank transaction/reference number before confirming this transfer.');
      referenceRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/admin/payments/manual', {
        registration_id: registration.id,
        payment_method: method,
        external_reference: externalReference.trim(),
        notes: notes.trim(),
      });
      await onConfirmed?.(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to confirm this payment.');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="offline-payment-title"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Offline payment</p>
            <h2 id="offline-payment-title" className="mt-1 text-xl font-black text-slate-950 dark:text-white">Confirm payment</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Registration #{registration.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-indigo-500/20"
            aria-label="Close payment confirmation"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
            <p className="font-bold text-slate-950 dark:text-white">{registration.user_name}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{registration.user_email}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Event</p>
                <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">{registration.event_title}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Amount to confirm</p>
                <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{formatMoney(registration.registration_fee)}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Payment method</label>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMethod('bank_transfer')}
                className={`rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-500/20 ${method === 'bank_transfer'
                  ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600'}`}
              >
                <Building2 size={20} className={method === 'bank_transfer' ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400'} />
                <p className="mt-3 font-black text-slate-950 dark:text-white">Bank transfer</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Use when funds were deposited or transferred into the organisation bank account.</p>
              </button>
              <button
                type="button"
                onClick={() => setMethod('manual')}
                className={`rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-500/20 ${method === 'manual'
                  ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600'}`}
              >
                <Banknote size={20} className={method === 'manual' ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400'} />
                <p className="mt-3 font-black text-slate-950 dark:text-white">Manual payment</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Use for other verified offline payment arrangements recorded by an administrator.</p>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="offline-reference" className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {method === 'bank_transfer' ? 'Bank transaction/reference number' : 'External reference (optional)'}
            </label>
            <input
              ref={referenceRef}
              id="offline-reference"
              value={externalReference}
              onChange={(event) => setExternalReference(event.target.value)}
              maxLength={150}
              placeholder={method === 'bank_transfer' ? 'e.g. BANK-TRX-123456' : 'Receipt, voucher or other reference'}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label htmlFor="offline-notes" className="text-sm font-bold text-slate-800 dark:text-slate-200">Confirmation notes (optional)</label>
            <textarea
              id="offline-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Add any verification notes that should remain with the payment audit trail."
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-500/20"
            />
          </div>

          {error && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            Confirm only after you have independently verified that the full amount was received. This action immediately marks the registration as confirmed and records your administrator account in the audit trail.
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-100 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-green-500/20"
            >
              {submitting ? <LoaderCircle size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
              {submitting ? 'Confirming...' : 'Confirm received payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
