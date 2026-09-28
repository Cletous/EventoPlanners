const tones = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
  danger: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20',
  info: 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20',
};

export default function StatusBadge({ children, tone = 'neutral', dot = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ring-1 ring-inset ${tones[tone] || tones.neutral} ${className}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />}
      {children}
    </span>
  );
}
