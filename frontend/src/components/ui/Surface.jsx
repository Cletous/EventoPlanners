export default function Surface({ as: Component = 'section', children, className = '' }) {
  return (
    <Component className={`rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none ${className}`}>
      {children}
    </Component>
  );
}
