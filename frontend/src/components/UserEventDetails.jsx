import { CalendarDays, CircleDollarSign, MapPin, UserPlus, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../services/api';

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'full' }).format(
    new Date(`${String(value).slice(0, 10)}T00:00:00`),
  );
}

function formatTime(value) {
  if (!value) return '—';
  return String(value).slice(0, 5);
}

export default function UserEventDetails({ event, onClose, onRegistered }) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setSubmitting(false);
    setMessage('');
    setError('');
  }, [event?.id]);

  if (!event) return null;

  const registrationCount = Number(event.registration_count || 0);
  const availablePlaces = Math.max(Number(event.capacity) - registrationCount, 0);
  const isFull = availablePlaces <= 0;

  const registerForEvent = async () => {
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/registrations', { event_id: event.id });
      setMessage(response.data.message || 'Registration completed.');
      onRegistered?.(response.data.registration);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to register for this event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {event.image_url ? (
          <img src={event.image_url} alt="" className="h-56 w-full rounded-t-3xl object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-t-3xl bg-gradient-to-br from-indigo-100 via-violet-100 to-purple-100 text-indigo-500"><CalendarDays size={52} /></div>
        )}

        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-700">Published</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{event.title}</h2>
            </div>
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close event details"><X size={21} /></button>
          </div>

          <p className="mt-5 whitespace-pre-line leading-7 text-slate-600">{event.description}</p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><MapPin size={16} /> Venue</div><p className="mt-2 font-bold text-slate-900">{event.venue}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><CalendarDays size={16} /> Date & time</div><p className="mt-2 font-bold text-slate-900">{formatDate(event.event_date)}</p><p className="mt-1 text-sm text-slate-600">Starts at {formatTime(event.start_time)}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><CircleDollarSign size={16} /> Registration fee</div><p className="mt-2 font-bold text-slate-900">{Number(event.registration_fee) === 0 ? 'Free' : `US$${Number(event.registration_fee).toFixed(2)}`}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Users size={16} /> Availability</div><p className="mt-2 font-bold text-slate-900">{availablePlaces} of {event.capacity} places available</p></div>
          </div>

          {message && <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</div>}
          {error && <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

          <button
            type="button"
            onClick={registerForEvent}
            disabled={submitting || isFull || Boolean(message)}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UserPlus size={18} />
            {submitting ? 'Registering...' : isFull ? 'Event full' : message ? 'Registered' : Number(event.registration_fee) === 0 ? 'Register for free' : 'Register for event'}
          </button>
          {Number(event.registration_fee) > 0 && !message && !isFull && (
            <p className="mt-3 text-center text-sm text-slate-500">This is a paid event. Your registration will remain pending until payment is completed in Milestone 9.</p>
          )}
        </div>
      </div>
    </div>
  );
}
