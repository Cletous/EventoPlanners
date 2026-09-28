import {
  CalendarDays,
  CircleDollarSign,
  Clock3,
  CreditCard,
  MapPin,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { AlertBanner } from './ui/Feedback';
import StatusBadge from './ui/StatusBadge';

function formatDate(value) {
  if (!value) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'full' }).format(
    new Date(`${String(value).slice(0, 10)}T00:00:00`),
  );
}

function formatTime(value) {
  if (!value) return 'Time TBA';
  return String(value).slice(0, 5);
}

function DetailItem({ icon: Icon, label, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/55">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
        <Icon size={15} className="text-indigo-500 dark:text-indigo-300" /> {label}
      </div>
      <div className="mt-2 text-sm font-bold leading-6 text-slate-900 dark:text-slate-100">{children}</div>
    </div>
  );
}

export default function UserEventDetails({ event, onClose, onRegistered }) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setSubmitting(false);
    setMessage('');
    setError('');
    setImageFailed(false);
  }, [event?.id]);

  useEffect(() => {
    if (!event) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (keyboardEvent) => {
      if (keyboardEvent.key === 'Escape' && !submitting) onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [event, onClose, submitting]);

  if (!event) return null;

  const registrationCount = Number(event.registration_count || 0);
  const capacity = Number(event.capacity || 0);
  const availablePlaces = Math.max(capacity - registrationCount, 0);
  const isFull = availablePlaces <= 0;
  const fee = Number(event.registration_fee || 0);
  const occupancy = capacity > 0 ? Math.min((registrationCount / capacity) * 100, 100) : 0;

  const registerForEvent = async () => {
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/registrations', { event_id: event.id });
      setMessage(response.data.message || 'Registration completed.');
      onRegistered?.(response.data.registration);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to register for this event.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-details-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose?.();
      }}
    >
      <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-t-[1.75rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:rounded-[1.75rem]">
        <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-950 sm:h-64">
          {event.image_url && !imageFailed ? (
            <img
              src={event.image_url}
              alt={`${event.title} event`}
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-100 via-violet-50 to-purple-100 text-indigo-500 dark:from-indigo-500/15 dark:via-violet-500/10 dark:to-purple-500/15 dark:text-indigo-300">
              <div className="text-center">
                <CalendarDays className="mx-auto" size={50} />
                <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.2em]">EventoPlanners</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-slate-950/10" />
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/60 bg-white/90 text-slate-700 shadow-lg backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/85 dark:text-slate-200 dark:hover:bg-slate-900"
            aria-label="Close event details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="success" dot>Published</StatusBadge>
                <StatusBadge tone="info">{fee === 0 ? 'Free event' : `US$${fee.toFixed(2)}`}</StatusBadge>
              </div>
              <h2 id="event-details-title" className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{event.title}</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">{event.description}</p>
            </div>

            <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/55 lg:w-60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Event capacity</span>
                <span className={`font-extrabold ${isFull ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{isFull ? 'Full' : `${availablePlaces} left`}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${occupancy}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{registrationCount} of {capacity} places currently taken</p>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem icon={MapPin} label="Venue">{event.venue}</DetailItem>
            <DetailItem icon={CalendarDays} label="Date">{formatDate(event.event_date)}</DetailItem>
            <DetailItem icon={Clock3} label="Start time">{formatTime(event.start_time)}</DetailItem>
            <DetailItem icon={CircleDollarSign} label="Registration fee">{fee === 0 ? 'Free' : `US$${fee.toFixed(2)}`}</DetailItem>
          </div>

          {message && <AlertBanner tone="success" title="Registration created" className="mt-6">{message}</AlertBanner>}

          {error && <AlertBanner tone="error" className="mt-6">{error}</AlertBanner>}

          <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/35 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                {fee > 0 ? <CreditCard size={19} /> : <ShieldCheck size={19} />}
              </span>
              <div>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">{fee > 0 ? 'Registration first, payment next' : 'No payment required'}</p>
                <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {fee > 0
                    ? 'Your place is created first. You can then complete Paynow payment from your registrations area; no payment is initiated from this details window.'
                    : 'Register to secure your place. Your registration is confirmed without a payment step.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={registerForEvent}
              disabled={submitting || isFull || Boolean(message)}
              className="inline-flex min-w-52 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-indigo-500/20"
            >
              {submitting ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Registering...</>
              ) : (
                <><UserPlus size={18} /> {isFull ? 'Event full' : message ? 'Registered' : fee === 0 ? 'Register for free' : 'Register for event'}</>
              )}
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <Users size={14} /> Registration availability is based on the latest event capacity information.
          </div>
        </div>
      </div>
    </div>
  );
}
