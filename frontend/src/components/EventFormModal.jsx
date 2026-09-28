import { AlertCircle, CalendarDays, Image, MapPin, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const emptyForm = {
  title: '',
  description: '',
  venue: '',
  event_date: '',
  start_time: '',
  registration_fee: '0.00',
  capacity: '100',
  status: 'draft',
  image_url: '',
};

function toForm(event) {
  if (!event) return emptyForm;
  return {
    title: event.title || '',
    description: event.description || '',
    venue: event.venue || '',
    event_date: event.event_date ? String(event.event_date).slice(0, 10) : '',
    start_time: event.start_time ? String(event.start_time).slice(0, 5) : '',
    registration_fee: String(event.registration_fee ?? '0.00'),
    capacity: String(event.capacity ?? '100'),
    status: event.status || 'draft',
    image_url: event.image_url || '',
  };
}

function FieldError({ children }) {
  if (!children) return null;
  return <span className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-300"><AlertCircle size={13} />{children}</span>;
}

export default function EventFormModal({ open, event, busy, serverErrors = {}, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [clientErrors, setClientErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(toForm(event));
      setClientErrors({});
    }
  }, [open, event]);

  if (!open) return null;

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const validate = () => {
    const errors = {};
    if (!form.title.trim()) errors.title = 'Title is required.';
    if (!form.description.trim()) errors.description = 'Description is required.';
    if (!form.venue.trim()) errors.venue = 'Venue is required.';
    if (!form.event_date) errors.event_date = 'Event date is required.';
    if (!form.start_time) errors.start_time = 'Start time is required.';

    const fee = Number(form.registration_fee);
    if (!Number.isFinite(fee) || fee < 0 || fee > 1000) errors.registration_fee = 'Use a fee from 0 to 1000.';

    const capacity = Number(form.capacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500) errors.capacity = 'Use a capacity from 1 to 500.';

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...form,
      registration_fee: Number(form.registration_fee),
      capacity: Number(form.capacity),
      image_url: form.image_url.trim() || null,
    });
  };

  const errors = { ...clientErrors, ...serverErrors };
  const fieldClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20';
  const labelClass = 'text-sm font-bold text-slate-700 dark:text-slate-200';

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="event-form-title">
      <div className="mx-auto my-4 w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:my-8">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-700 sm:px-8 sm:py-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Event management</p>
            <h2 id="event-form-title" className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{event ? 'Edit event' : 'Create event'}</h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Configure the event details attendees will see. Required fields are marked with an asterisk.</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-indigo-500/20" aria-label="Close event form">
            <X size={21} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
          <label className={`sm:col-span-2 ${labelClass}`}>
            Event title *
            <input value={form.title} onChange={(e) => setField('title', e.target.value)} maxLength={150} className={fieldClass} placeholder="e.g. Software Engineering Research Symposium" />
            <FieldError>{errors.title}</FieldError>
          </label>

          <label className={`sm:col-span-2 ${labelClass}`}>
            Description *
            <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows={5} className={fieldClass} placeholder="Explain what attendees can expect from this event." />
            <FieldError>{errors.description}</FieldError>
          </label>

          <label className={`sm:col-span-2 ${labelClass}`}>
            <span className="inline-flex items-center gap-1.5"><MapPin size={15} /> Venue *</span>
            <input value={form.venue} onChange={(e) => setField('venue', e.target.value)} maxLength={255} className={fieldClass} placeholder="Venue or meeting location" />
            <FieldError>{errors.venue}</FieldError>
          </label>

          <label className={labelClass}>
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} /> Event date *</span>
            <input type="date" value={form.event_date} onChange={(e) => setField('event_date', e.target.value)} className={fieldClass} />
            <FieldError>{errors.event_date}</FieldError>
          </label>

          <label className={labelClass}>
            Start time *
            <input type="time" value={form.start_time} onChange={(e) => setField('start_time', e.target.value)} className={fieldClass} />
            <FieldError>{errors.start_time}</FieldError>
          </label>

          <label className={labelClass}>
            Registration fee (USD) *
            <input type="number" min="0" max="1000" step="0.01" value={form.registration_fee} onChange={(e) => setField('registration_fee', e.target.value)} className={fieldClass} />
            <FieldError>{errors.registration_fee}</FieldError>
          </label>

          <label className={labelClass}>
            Capacity *
            <input type="number" min="1" max="500" step="1" value={form.capacity} onChange={(e) => setField('capacity', e.target.value)} className={fieldClass} />
            <FieldError>{errors.capacity}</FieldError>
          </label>

          <label className={labelClass}>
            Status *
            <select value={form.status} onChange={(e) => setField('status', e.target.value)} className={fieldClass}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
            </select>
            <FieldError>{errors.status}</FieldError>
          </label>

          <label className={labelClass}>
            <span className="inline-flex items-center gap-1.5"><Image size={15} /> Image URL</span>
            <input value={form.image_url} onChange={(e) => setField('image_url', e.target.value)} maxLength={500} placeholder="https://..." className={fieldClass} />
            <FieldError>{errors.image_url}</FieldError>
          </label>

          {errors.general && (
            <div className="sm:col-span-2 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              <AlertCircle className="mt-0.5 shrink-0" size={17} />
              <span>{errors.general}</span>
            </div>
          )}

          <div className="sm:col-span-2 mt-1 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-indigo-500/20">Cancel</button>
            <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-indigo-500/20">
              <Save size={17} />
              {busy ? 'Saving...' : event ? 'Save changes' : 'Create event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
