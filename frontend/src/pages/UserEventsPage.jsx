import {
  CalendarDays,
  ChevronLeft,
  CircleDollarSign,
  MapPin,
  Search,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import UserEventDetails from '../components/UserEventDetails';
import api from '../services/api';

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(
    new Date(`${String(value).slice(0, 10)}T00:00:00`),
  );
}

function formatTime(value) {
  if (!value) return '—';
  return String(value).slice(0, 5);
}

export default function UserEventsPage() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadEvents = async (query = '') => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/events', {
        params: query.trim() ? { search: query.trim() } : {},
      });
      setEvents(response.data.events || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents('');
  }, []);

  const openEvent = async (event) => {
    setDetailsLoading(true);
    setError('');

    try {
      const response = await api.get(`/events/${event.id}`);
      setSelectedEvent(response.data.event);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load event details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Logo compact />
          <div className="flex items-center gap-2">
            <Link to="/user/registrations" className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">My registrations</Link>
            <Link to="/user/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <ChevronLeft size={17} /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700"><CalendarDays size={16} /> Published events</span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">Discover your next event</h1>
          <p className="mt-2 text-slate-500">Browse and search events currently published by EventoPlanners administrators.</p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); loadEvents(search); }}
          className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by event, venue or description"
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </div>
          <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">Search</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); loadEvents(''); }} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">Clear</button>
          )}
        </form>

        {error && <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

        {loading ? (
          <div className="flex min-h-80 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>
        ) : events.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <CalendarDays className="mx-auto text-slate-300" size={46} />
            <h2 className="mt-4 text-xl font-bold text-slate-900">No published events found</h2>
            <p className="mt-2 text-slate-500">Try another search, or check again after an administrator publishes an event.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => {
              const registrationCount = Number(event.registration_count || 0);
              const availablePlaces = Math.max(Number(event.capacity) - registrationCount, 0);

              return (
                <article key={event.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt=""
                      className="h-44 w-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-100 text-indigo-500"><CalendarDays size={42} /></div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">Published</span>
                      <span className="text-xs font-semibold text-slate-400">#{event.id}</span>
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-slate-950">{event.title}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{event.description}</p>

                    <div className="mt-5 space-y-2.5 text-sm text-slate-600">
                      <p className="flex items-center gap-2"><MapPin size={16} className="text-indigo-500" /> {event.venue}</p>
                      <p className="flex items-center gap-2"><CalendarDays size={16} className="text-indigo-500" /> {formatDate(event.event_date)} at {formatTime(event.start_time)}</p>
                      <p className="flex items-center gap-2"><CircleDollarSign size={16} className="text-indigo-500" /> {Number(event.registration_fee) === 0 ? 'Free' : `US$${Number(event.registration_fee).toFixed(2)}`}</p>
                      <p className="flex items-center gap-2"><Users size={16} className="text-indigo-500" /> {availablePlaces} places available</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEvent(event)}
                      disabled={detailsLoading}
                      className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {detailsLoading ? 'Loading...' : 'View event'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <UserEventDetails
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onRegistered={() => loadEvents(search)}
      />
    </main>
  );
}
