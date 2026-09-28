import {
  ArrowRight,
  CalendarDays,
  MapPin,
  RefreshCw,
  Search,
  SearchX,
  Sparkles,
  TicketCheck,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import UserEventDetails from '../components/UserEventDetails';
import api from '../services/api';

function formatDateParts(value) {
  if (!value) return { day: '—', month: '—', full: 'Date unavailable' };

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return {
    day: new Intl.DateTimeFormat('en-ZW', { day: '2-digit' }).format(date),
    month: new Intl.DateTimeFormat('en-ZW', { month: 'short' }).format(date).toUpperCase(),
    full: new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(date),
  };
}

function formatTime(value) {
  if (!value) return 'Time TBA';
  return String(value).slice(0, 5);
}

function eventFee(event) {
  const amount = Number(event.registration_fee || 0);
  return amount === 0 ? 'Free entry' : `US$${amount.toFixed(2)}`;
}

function EventImage({ event }) {
  const [failed, setFailed] = useState(false);

  if (!event.image_url || failed) {
    return (
      <div className="flex h-full min-h-48 items-center justify-center bg-gradient-to-br from-indigo-100 via-violet-50 to-purple-100 text-indigo-500 dark:from-indigo-500/15 dark:via-violet-500/10 dark:to-purple-500/15 dark:text-indigo-300">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 shadow-sm backdrop-blur dark:bg-slate-900/70">
            <CalendarDays size={29} />
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-indigo-500/80 dark:text-indigo-300/80">EventoPlanners</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={event.image_url}
      alt={`${event.title} event`}
      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
      onError={() => setFailed(true)}
    />
  );
}

function EventCard({ event, loading, onOpen }) {
  const registrationCount = Number(event.registration_count || 0);
  const capacity = Number(event.capacity || 0);
  const availablePlaces = Math.max(capacity - registrationCount, 0);
  const isFull = availablePlaces <= 0;
  const date = formatDateParts(event.event_date);
  const occupancy = capacity > 0 ? Math.min((registrationCount / capacity) * 100, 100) : 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-slate-200/90 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/40 dark:hover:shadow-black/20">
      <div className="relative h-52 overflow-hidden">
        <EventImage event={event} />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-emerald-700 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-950/85 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Published
          </span>
          <div className="rounded-2xl border border-white/70 bg-white/90 px-3 py-2 text-center shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-950/85">
            <p className="text-[10px] font-extrabold tracking-[0.16em] text-indigo-600 dark:text-indigo-300">{date.month}</p>
            <p className="mt-0.5 text-xl font-black leading-none text-slate-950 dark:text-white">{date.day}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-300">{eventFee(event)}</p>
            <h2 className="mt-2 line-clamp-2 text-xl font-black tracking-tight text-slate-950 dark:text-white">{event.title}</h2>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {event.description || 'View this event to see full details and registration information.'}
        </p>

        <div className="mt-5 grid gap-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><MapPin size={16} /></span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Venue</p>
              <p className="mt-0.5 truncate font-semibold text-slate-700 dark:text-slate-200">{event.venue}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><CalendarDays size={16} /></span>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Schedule</p>
              <p className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">{date.full} · {formatTime(event.start_time)}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400"><Users size={14} /> Availability</span>
            <span className={`font-extrabold ${isFull ? 'text-red-600 dark:text-red-400' : availablePlaces <= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {isFull ? 'Event full' : `${availablePlaces} place${availablePlaces === 1 ? '' : 's'} left`}
            </span>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${occupancy}%` }} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpen(event)}
          disabled={loading}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-400 dark:focus-visible:ring-indigo-500/20"
        >
          {loading ? (
            <><RefreshCw size={17} className="animate-spin" /> Loading event</>
          ) : (
            <>View event <ArrowRight size={17} /></>
          )}
        </button>
      </div>
    </article>
  );
}

function LoadingGrid() {
  return (
    <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div key={item} className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="h-52 animate-pulse bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-4 p-6">
            <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-6 w-4/5 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800/70" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800/70" />
            <div className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function UserEventsPage() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailsLoadingId, setDetailsLoadingId] = useState(null);

  const loadEvents = async (query = '') => {
    setLoading(true);
    setError('');

    try {
      const cleanQuery = query.trim();
      const response = await api.get('/events', {
        params: cleanQuery ? { search: cleanQuery } : {},
      });
      setEvents(response.data.events || []);
      setAppliedSearch(cleanQuery);
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
    setDetailsLoadingId(event.id);
    setError('');

    try {
      const response = await api.get(`/events/${event.id}`);
      setSelectedEvent(response.data.event);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load event details.');
    } finally {
      setDetailsLoadingId(null);
    }
  };

  const clearSearch = () => {
    setSearch('');
    loadEvents('');
  };

  return (
    <AppShell role="user">
      <section className="overflow-hidden rounded-[1.75rem] border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/70 to-violet-50 px-5 py-6 shadow-sm dark:border-indigo-500/20 dark:from-slate-900 dark:via-indigo-950/35 dark:to-violet-950/25 sm:px-7 sm:py-7 xl:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.13em] text-indigo-600 shadow-sm backdrop-blur dark:border-indigo-500/20 dark:bg-slate-900/75 dark:text-indigo-300">
              <Sparkles size={14} /> Discover events
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">Find something worth showing up for.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
              Browse published events, review availability and registration fees, then secure your place from one clear event view.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none"><TicketCheck size={20} /></div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Currently showing</p>
              <p className="text-lg font-black text-slate-950 dark:text-white">{loading ? '—' : events.length} event{events.length === 1 ? '' : 's'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadEvents(search);
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <label className="relative flex-1">
            <span className="sr-only">Search published events</span>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search event name, venue or description"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-indigo-500 dark:focus:bg-slate-950 dark:focus:ring-indigo-500/15"
            />
          </label>
          <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-indigo-500/20">
            <Search size={17} /> Search
          </button>
          {(search || appliedSearch) && (
            <button type="button" onClick={clearSearch} disabled={loading} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-slate-700/40">
              Clear
            </button>
          )}
        </form>
        {appliedSearch && !loading && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <p className="font-semibold text-slate-500 dark:text-slate-400">Results for <span className="font-extrabold text-slate-800 dark:text-slate-200">“{appliedSearch}”</span></p>
            <p className="font-semibold text-slate-400 dark:text-slate-500">{events.length} result{events.length === 1 ? '' : 's'}</p>
          </div>
        )}
      </section>

      {error && (
        <div role="alert" className="mt-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold">{error}</p>
          <button type="button" onClick={() => loadEvents(appliedSearch)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-500/10">
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      )}

      {loading ? (
        <LoadingGrid />
      ) : events.length === 0 ? (
        <section className="mt-7 rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"><SearchX size={30} /></div>
          <h3 className="mt-5 text-xl font-black text-slate-950 dark:text-white">{appliedSearch ? 'No events match your search' : 'No published events yet'}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            {appliedSearch ? 'Try a broader event name, venue or keyword, or clear the search to see every published event.' : 'Published events will appear here as soon as an administrator makes them available.'}
          </p>
          {appliedSearch && (
            <button type="button" onClick={clearSearch} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700">Show all events</button>
          )}
        </section>
      ) : (
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} loading={detailsLoadingId === event.id} onOpen={openEvent} />
          ))}
        </div>
      )}

      <UserEventDetails
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onRegistered={() => loadEvents(appliedSearch)}
      />
    </AppShell>
  );
}
