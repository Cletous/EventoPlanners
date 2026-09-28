import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${danger ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300'}`}>
            <AlertTriangle size={22} />
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-indigo-500/20"
            aria-label="Close confirmation dialog"
          >
            <X size={20} />
          </button>
        </div>
        <h2 id="confirm-dialog-title" className="mt-5 text-xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h2>
        <p className="mt-2 leading-6 text-slate-600 dark:text-slate-300">{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-indigo-500/20"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-xl px-4 py-2.5 font-bold text-white transition focus-visible:outline-none focus-visible:ring-4 disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-100 dark:focus-visible:ring-red-500/20' : 'bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-500/20'}`}
          >
            {busy ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
