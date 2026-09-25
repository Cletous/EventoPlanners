import {
  CalendarDays,
  ChevronLeft,
  CircleDollarSign,
  Edit3,
  Eye,
  MapPin,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import EventFormModal from '../components/EventFormModal';
import Logo from '../components/Logo';
import api from '../services/api';

function StatusBadge({ status }) {
  const styles = {
    draft: 'bg-slate-100 text-slate-700',
    published: 'bg-green-50 text-green-700',
    closed: 'bg-amber-50 text-amber-700',
  };

  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${styles[status] || styles.draft}`}>{status}</span>;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2"><StatusBadge status={event.status} /><span className="text-xs font-semibold text-slate-400">Event #{event.id}</span></div>
            <h2 className="mt-3 text-2xl font-bold text-slate-950">{event.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={20} /></button>
        </div>
        <p className="mt-5 whitespace-pre-line leading-7 text-slate-600">{event.description}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Venue</p><p className="mt-1 font-semibold text-slate-900">{event.venue}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Date & time</p><p className="mt-1 font-semibold text-slate-900">{formatDate(event.event_date)} at {formatTime(event.start_time)}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Fee</p><p className="mt-1 font-semibold text-slate-900">US${Number(event.registration_fee).toFixed(2)}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Capacity</p><p className="mt-1 font-semibold text-slate-900">{event.capacity} attendees</p></div>
        </div>
        {event.image_url && <p className="mt-5 break-all text-sm text-slate-500"><span className="font-semibold text-slate-700">Image URL:</span> {event.image_url}</p>}
      </div>
    </div>
  );
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formBusy, setFormBusy] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [viewingEvent, setViewingEvent] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const loadEvents = async (query = search) => {
    setLoading(true);
    try {
      const response = await api.get('/admin/events', { params: query.trim() ? { search: query.trim() } : {} });
      setEvents(response.data.events || []);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Unable to load events.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents('');
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
        ? `“${event.title}” will become available as a published event.`
        : `“${event.title}” will be marked closed. Attendees should no longer be able to register once attendee registration is implemented.`,
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

  const totalPublished = events.filter((event) => event.status === 'published').length;
  const totalRegistrations = events.reduce((sum, event) => sum + Number(event.registration_count || 0), 0);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Logo compact />
          <Link to="/admin/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ChevronLeft size={17} /> Dashboard</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">Administrator</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Event management</h1>
            <p className="mt-2 text-slate-500">Create, edit, publish, close, search and safely delete events.</p>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-indigo-700"><Plus size={18} /> Create event</button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><CalendarDays className="text-indigo-600" size={21} /><p className="mt-3 text-2xl font-bold text-slate-950">{events.length}</p><p className="text-sm text-slate-500">Events shown</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Eye className="text-green-600" size={21} /><p className="mt-3 text-2xl font-bold text-slate-950">{totalPublished}</p><p className="text-sm text-slate-500">Published</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Users className="text-violet-600" size={21} /><p className="mt-3 text-2xl font-bold text-slate-950">{totalRegistrations}</p><p className="text-sm text-slate-500">Registrations</p></div>
        </div>

        {message && (
          <div className={`fixed right-5 top-5 z-[60] max-w-sm rounded-2xl px-5 py-4 font-semibold shadow-xl ${message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
            {message.text}
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <form
              onSubmit={(e) => { e.preventDefault(); loadEvents(); }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, venue or description" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" />
              </div>
              <button type="submit" className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800">Search</button>
              {search && <button type="button" onClick={() => { setSearch(''); loadEvents(''); }} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">Clear</button>}
            </form>
          </div>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>
          ) : events.length === 0 ? (
            <div className="px-6 py-16 text-center"><CalendarDays className="mx-auto text-slate-300" size={42} /><h2 className="mt-4 text-lg font-bold text-slate-900">No events found</h2><p className="mt-1 text-slate-500">Create your first event or change the search terms.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr><th className="px-5 py-3.5">Event</th><th className="px-5 py-3.5">Schedule</th><th className="px-5 py-3.5">Fee / Capacity</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5">Registrations</th><th className="px-5 py-3.5 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4"><p className="font-bold text-slate-900">{event.title}</p><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={14} /> {event.venue}</p></td>
                      <td className="px-5 py-4 text-sm text-slate-600"><p>{formatDate(event.event_date)}</p><p className="mt-1">{formatTime(event.start_time)}</p></td>
                      <td className="px-5 py-4 text-sm text-slate-600"><p className="flex items-center gap-1"><CircleDollarSign size={14} /> US${Number(event.registration_fee).toFixed(2)}</p><p className="mt-1">{event.capacity} places</p></td>
                      <td className="px-5 py-4"><StatusBadge status={event.status} /></td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">{Number(event.registration_count || 0)}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setViewingEvent(event)} title="View" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-white hover:text-indigo-600"><Eye size={17} /></button>
                          <button onClick={() => openEdit(event)} title="Edit" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-white hover:text-indigo-600"><Edit3 size={17} /></button>
                          {event.status !== 'published' && <button onClick={() => requestStatusChange(event, 'published')} className="rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-100">Publish</button>}
                          {event.status !== 'closed' && <button onClick={() => requestStatusChange(event, 'closed')} className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100">Close</button>}
                          <button onClick={() => requestDelete(event)} title="Delete" className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"><Trash2 size={17} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
    </main>
  );
}
