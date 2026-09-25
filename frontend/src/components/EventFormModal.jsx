import { X } from 'lucide-react';
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
    event_date: String(event.event_date || '').slice(0, 10),
    start_time: String(event.start_time || '').slice(0, 5),
    registration_fee: String(event.registration_fee ?? '0.00'),
    capacity: String(event.capacity ?? 100),
    status: event.status || 'draft',
    image_url: event.image_url || '',
  };
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
  const fieldClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="mx-auto my-6 w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">Event management</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">{event ? 'Edit event' : 'Create event'}</h2>
            <p className="mt-1 text-sm text-slate-500">Fields marked required must be completed before saving.</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={21} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm font-semibold text-slate-700">
            Event title *
            <input value={form.title} onChange={(e) => setField('title', e.target.value)} maxLength={150} className={fieldClass} />
            {errors.title && <span className="mt-1 block text-xs text-red-600">{errors.title}</span>}
          </label>

          <label className="sm:col-span-2 text-sm font-semibold text-slate-700">
            Description *
            <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows={5} className={fieldClass} />
            {errors.description && <span className="mt-1 block text-xs text-red-600">{errors.description}</span>}
          </label>

          <label className="sm:col-span-2 text-sm font-semibold text-slate-700">
            Venue *
            <input value={form.venue} onChange={(e) => setField('venue', e.target.value)} maxLength={255} className={fieldClass} />
            {errors.venue && <span className="mt-1 block text-xs text-red-600">{errors.venue}</span>}
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Event date *
            <input type="date" value={form.event_date} onChange={(e) => setField('event_date', e.target.value)} className={fieldClass} />
            {errors.event_date && <span className="mt-1 block text-xs text-red-600">{errors.event_date}</span>}
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Start time *
            <input type="time" value={form.start_time} onChange={(e) => setField('start_time', e.target.value)} className={fieldClass} />
            {errors.start_time && <span className="mt-1 block text-xs text-red-600">{errors.start_time}</span>}
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Registration fee (USD) *
            <input type="number" min="0" max="1000" step="0.01" value={form.registration_fee} onChange={(e) => setField('registration_fee', e.target.value)} className={fieldClass} />
            {errors.registration_fee && <span className="mt-1 block text-xs text-red-600">{errors.registration_fee}</span>}
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Capacity *
            <input type="number" min="1" max="500" step="1" value={form.capacity} onChange={(e) => setField('capacity', e.target.value)} className={fieldClass} />
            {errors.capacity && <span className="mt-1 block text-xs text-red-600">{errors.capacity}</span>}
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Status *
            <select value={form.status} onChange={(e) => setField('status', e.target.value)} className={fieldClass}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
            </select>
            {errors.status && <span className="mt-1 block text-xs text-red-600">{errors.status}</span>}
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Image URL (optional)
            <input value={form.image_url} onChange={(e) => setField('image_url', e.target.value)} maxLength={500} placeholder="https://..." className={fieldClass} />
            {errors.image_url && <span className="mt-1 block text-xs text-red-600">{errors.image_url}</span>}
          </label>

          {errors.general && <div className="sm:col-span-2 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{errors.general}</div>}

          <div className="sm:col-span-2 mt-2 flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={busy} className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {busy ? 'Saving...' : event ? 'Save changes' : 'Create event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
