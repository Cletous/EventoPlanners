import {
  CalendarDays,
  CircleDollarSign,
  Edit3,
  Eye,
  Filter,
  MapPin,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell';
import ConfirmDialog from '../components/ConfirmDialog';
import EventFormModal from '../components/EventFormModal';
import api from '../services/api';

function StatusBadge({ status }) {
  const styles = {
    draft: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
    published: 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300',
    closed: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(new Date(`${String(value).slice(0, 10)}T00:00:00`));
}

function formatTime(value) {
  if (!value) return '—';
  return String(value).slice(0, 5);
}

function EventDetails({ event, onClose }) {
  if (!event) return null;

  const registrationCount = Number(event.registration_count || 0);
  const capacity = Number(event.capacity || 0);
  const utilization = capacity > 0 ? Math.min(100, Math.round((registrationCount / capacity) * 100)) : 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-event-details-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:px-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={event.status} />
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Event #{event.id}</span>
            </div>
            <h2 id="admin-event-details-title" className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              {event.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-indigo-500/20"
            aria-label="Close event details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <p className="whitespace-pre-line leading-7 text-slate-600 dark:text-slate-300">{event.description}</p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Venue</p>
              <p className="mt-1.5 font-semibold text-slate-900 dark:text-white">{event.venue}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Date & time</p>
              <p className="mt-1.5 font-semibold text-slate-900 dark:text-white">{formatDate(event.event_date)} at {formatTime(event.start_time)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Registration fee</p>
              <p className="mt-1.5 font-semibold text-slate-900 dark:text-white">US${Number(event.registration_fee || 0).toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Attendance</p>
                  <p className="mt-1.5 font-semibold text-slate-900 dark:text-white">{registrationCount} of {capacity} registrations</p>
                </div>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-300">{utilization}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${utilization}%` }} />
              </div>
            </div>
          </div>

          {event.image_url && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Image URL</p>
              <p className="mt-1.5 break-all text-sm text-slate-600 dark:text-slate-300">{event.image_url}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, hint, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
    green: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone] || tones.indigo}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formBusy, setFormBusy] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [viewingEvent, setViewingEvent] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const loadEvents = async (query = activeSearch) => {
    setLoading(true);
    try {
      const trimmed = query.trim();
      const response = await api.get('/admin/events', { params: trimmed ? { search: trimmed } : {} });
      setEvents(response.data.events || []);
      setActiveSearch(trimmed);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Unable to load events.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents('');
    // Initial load only; later reloads are triggered explicitly by search and CRUD actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 3500);
  };

  const openCreate = () => {
    setEditingEvent(null);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (event) => {
    setEditingEvent(event);
    setFormErrors({});
    setFormOpen(true);
  };

  const saveEvent = async (payload) => {
    setFormBusy(true);
    setFormErrors({});
    try {
      const response = editingEvent
        ? await api.patch(`/admin/events/${editingEvent.id}`, payload)
        : await api.post('/admin/events', payload);

      setFormOpen(false);
      showMessage('success', response.data.message);
      await loadEvents();
    } catch (error) {
      setFormErrors(error.response?.data?.errors || {});
      if (!error.response?.data?.errors) showMessage('error', error.response?.data?.message || 'Unable to save event.');
    } finally {
      setFormBusy(false);
    }
  };

  const requestStatusChange = (event, status) => {
    setConfirmation({
      event,
      action: 'status',
      status,
      title: status === 'published' ? 'Publish this event?' : 'Close this event?',
      message: status === 'published'
        ? `“${event.title}” will become visible to attendees and available for eligible registrations.`
        : `“${event.title}” will be marked closed and will no longer accept new attendee registrations.`,
      confirmLabel: status === 'published' ? 'Publish event' : 'Close event',
      danger: false,
    });
  };

  const requestDelete = (event) => {
    setConfirmation({
      event,
      action: 'delete',
      title: 'Delete this event?',
      message: Number(event.registration_count) > 0
        ? `“${event.title}” already has registrations and cannot be deleted. Close it instead.`
        : `“${event.title}” will be permanently removed. This action cannot be undone.`,
      confirmLabel: Number(event.registration_count) > 0 ? 'Close dialog' : 'Delete event',
      danger: Number(event.registration_count) === 0,
      blocked: Number(event.registration_count) > 0,
    });
  };

  const confirmAction = async () => {
    if (!confirmation) return;
    if (confirmation.blocked) {
      setConfirmation(null);
      return;
    }

    setConfirmBusy(true);
    try {
      const response = confirmation.action === 'delete'
        ? await api.delete(`/admin/events/${confirmation.event.id}`)
        : await api.patch(`/admin/events/${confirmation.event.id}`, { status: confirmation.status });

      showMessage('success', response.data.message);
      setConfirmation(null);
      await loadEvents();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Unable to complete the action.');
      setConfirmation(null);
    } finally {
      setConfirmBusy(false);
    }
  };

  const filteredEvents = useMemo(() => {
    if (statusFilter === 'all') return events;
    return events.filter((event) => event.status === statusFilter);
  }, [events, statusFilter]);

  const totalPublished = events.filter((event) => event.status === 'published').length;
  const totalDraft = events.filter((event) => event.status === 'draft').length;
  const totalRegistrations = events.reduce((sum, event) => sum + Number(event.registration_count || 0), 0);

  const clearSearch = () => {
    setSearch('');
    loadEvents('');
  };

  return (
    <AppShell role="admin">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="relative px-5 py-6 sm:px-7 sm:py-7">
            <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-indigo-100/70 blur-3xl dark:bg-indigo-500/10" />
            <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div className="max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Event operations</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">Manage your event catalogue</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                  Create, publish and maintain events from one workspace while keeping registrations and capacity visible at a glance.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-500/20"
              >
                <Plus size={18} />
                Create event
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={CalendarDays} label="Events loaded" value={events.length} hint={activeSearch ? `Search: “${activeSearch}”` : 'Current catalogue'} />
          <SummaryCard icon={Eye} label="Published" value={totalPublished} hint="Visible to attendees" tone="green" />
          <SummaryCard icon={Filter} label="Draft" value={totalDraft} hint="Not yet published" tone="amber" />
          <SummaryCard icon={Users} label="Registrations" value={totalRegistrations} hint="Across loaded events" tone="violet" />
        </section>

        {message && (
          <div className={`fixed right-4 top-24 z-[80] max-w-sm rounded-2xl px-5 py-4 text-sm font-bold text-white shadow-2xl sm:right-6 ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`} role="status">
            {message.text}
          </div>
        )}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white">Events</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Search the server catalogue, then narrow the loaded results by status.</p>
              </div>

              <div className="flex flex-wrap gap-2" aria-label="Filter events by status">
                {[
                  ['all', 'All'],
                  ['published', 'Published'],
                  ['draft', 'Draft'],
                  ['closed', 'Closed'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={`rounded-xl px-3.5 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-500/20 ${statusFilter === value ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadEvents(search);
              }}
              className="mt-4 flex flex-col gap-3 lg:flex-row"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title, venue or description"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                />
              </div>
              <button type="submit" className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:focus-visible:ring-slate-700">
                Search
              </button>
              {(search || activeSearch) && (
                <button type="button" onClick={clearSearch} className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:ring-indigo-500/20">
                  Clear
                </button>
              )}
            </form>
          </div>

          {loading ? (
            <div className="p-5 sm:p-6">
              <div className="space-y-3" aria-label="Loading events">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                ))}
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <CalendarDays size={28} />
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">No events found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                {statusFilter !== 'all' ? `No ${statusFilter} events match the currently loaded results.` : 'Create your first event or change the search terms.'}
              </p>
              {statusFilter !== 'all' && (
                <button type="button" onClick={() => setStatusFilter('all')} className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                  Show all statuses
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:px-6">
                <span>{filteredEvents.length} event{filteredEvents.length === 1 ? '' : 's'} shown</span>
                <span className="hidden sm:inline">Scroll horizontally to view all columns. Event and Actions stay pinned.</span>
              </div>
              <div className="overflow-x-auto overscroll-x-contain">
                <table className="w-full min-w-[1080px] border-separate border-spacing-0 text-left">
                  <thead className="text-xs font-black uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="sticky left-0 z-20 min-w-[290px] border-b border-r border-slate-200 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-950">Event</th>
                      <th className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-950">Schedule</th>
                      <th className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-950">Fee / Capacity</th>
                      <th className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-950">Status</th>
                      <th className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 text-center dark:border-slate-800 dark:bg-slate-950">Registrations</th>
                      <th className="sticky right-0 z-20 min-w-[245px] border-b border-l border-slate-200 bg-slate-50 px-5 py-3.5 text-right dark:border-slate-800 dark:bg-slate-950">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event) => {
                      const registrationCount = Number(event.registration_count || 0);
                      const capacity = Number(event.capacity || 0);
                      const utilization = capacity > 0 ? Math.min(100, Math.round((registrationCount / capacity) * 100)) : 0;

                      return (
                        <tr key={event.id} className="group">
                          <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-5 py-4 transition group-hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:group-hover:bg-slate-800/80">
                            <button type="button" onClick={() => setViewingEvent(event)} className="block max-w-[260px] text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-500/20">
                              <p className="truncate font-black text-slate-950 transition group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">{event.title}</p>
                              <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                                <MapPin size={14} className="shrink-0" />
                                <span className="truncate">{event.venue}</span>
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">ID #{event.id}</p>
                            </button>
                          </td>
                          <td className="border-b border-slate-100 px-5 py-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(event.event_date)}</p>
                            <p className="mt-1 text-slate-500 dark:text-slate-400">{formatTime(event.start_time)}</p>
                          </td>
                          <td className="border-b border-slate-100 px-5 py-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                            <p className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200"><CircleDollarSign size={14} /> US${Number(event.registration_fee || 0).toFixed(2)}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${utilization}%` }} />
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400">{registrationCount}/{capacity}</span>
                            </div>
                          </td>
                          <td className="border-b border-slate-100 px-5 py-4 dark:border-slate-800"><StatusBadge status={event.status} /></td>
                          <td className="border-b border-slate-100 px-5 py-4 text-center dark:border-slate-800">
                            <span className="inline-flex min-w-10 items-center justify-center rounded-xl bg-slate-100 px-2.5 py-1.5 text-sm font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">{registrationCount}</span>
                          </td>
                          <td className="sticky right-0 z-10 border-b border-l border-slate-100 bg-white px-5 py-4 transition group-hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:group-hover:bg-slate-800/80">
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => setViewingEvent(event)} title="View event" aria-label={`View ${event.title}`} className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300 dark:focus-visible:ring-indigo-500/20"><Eye size={17} /></button>
                              <button type="button" onClick={() => openEdit(event)} title="Edit event" aria-label={`Edit ${event.title}`} className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300 dark:focus-visible:ring-indigo-500/20"><Edit3 size={17} /></button>
                              {event.status !== 'published' && <button type="button" onClick={() => requestStatusChange(event, 'published')} className="rounded-xl bg-green-50 px-3 py-2 text-xs font-black text-green-700 transition hover:bg-green-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-100 dark:bg-green-500/10 dark:text-green-300 dark:hover:bg-green-500/15 dark:focus-visible:ring-green-500/20">Publish</button>}
                              {event.status !== 'closed' && <button type="button" onClick={() => requestStatusChange(event, 'closed')} className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15 dark:focus-visible:ring-amber-500/20">Close</button>}
                              <button type="button" onClick={() => requestDelete(event)} title="Delete event" aria-label={`Delete ${event.title}`} className="rounded-xl border border-red-100 p-2 text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10 dark:focus-visible:ring-red-500/20"><Trash2 size={17} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      <EventFormModal
        open={formOpen}
        event={editingEvent}
        busy={formBusy}
        serverErrors={formErrors}
        onClose={() => !formBusy && setFormOpen(false)}
        onSubmit={saveEvent}
      />
      <EventDetails event={viewingEvent} onClose={() => setViewingEvent(null)} />
      <ConfirmDialog
        open={Boolean(confirmation)}
        title={confirmation?.title}
        message={confirmation?.message}
        confirmLabel={confirmation?.confirmLabel}
        danger={confirmation?.danger}
        busy={confirmBusy}
        onCancel={() => !confirmBusy && setConfirmation(null)}
        onConfirm={confirmAction}
      />
    </AppShell>
  );
}
