import {
  AlertCircle,
  CheckCircle2,
  Info,
  LoaderCircle,
  TriangleAlert,
} from 'lucide-react';

const toneStyles = {
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  error: {
    wrapper: 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300',
    icon: AlertCircle,
  },
  warning: {
    wrapper: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300',
    icon: TriangleAlert,
  },
  info: {
    wrapper: 'border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300',
    icon: Info,
  },
};

export function AlertBanner({ tone = 'info', title, children, action, className = '' }) {
  const config = toneStyles[tone] || toneStyles.info;
  const Icon = config.icon;
  const role = tone === 'error' ? 'alert' : 'status';

  return (
    <div role={role} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${config.wrapper} ${className}`}>
      <Icon size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-extrabold">{title}</p>}
        <div className={`${title ? 'mt-1' : ''} font-medium leading-6`}>{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Loading...', className = '' }) {
  return (
    <div className={`flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      <div>
        <LoaderCircle size={34} className="mx-auto animate-spin text-indigo-600 motion-reduce:animate-none dark:text-indigo-400" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900 ${className}`}>
      {Icon && (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          <Icon size={26} aria-hidden="true" />
        </div>
      )}
      <h3 className="mt-4 text-base font-extrabold text-slate-950 dark:text-white">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
