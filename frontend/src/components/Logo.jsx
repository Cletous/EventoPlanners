import { CalendarCheck2 } from "lucide-react";
import { useState } from "react";

export default function Logo({
  compact = false,
  showTagline = true,
  className = "",
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <div
        className={`${compact ? "h-10 w-10" : "h-11 w-11"} flex shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5`}
      >
        {!imageFailed ? (
          <img
            src="/eventoplanners-logo.png"
            alt="EventoPlanners"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-contain p-1.5"
          />
        ) : (
          <CalendarCheck2
            className="text-white"
            size={compact ? 22 : 24}
            strokeWidth={2.2}
            aria-hidden="true"
          />
        )}
      </div>

      <div className="min-w-0 leading-none">
        <p
          className={`${compact ? "text-base" : "text-lg"} truncate font-extrabold tracking-tight text-slate-950 dark:text-white`}
        >
          Evento
          <span className="text-indigo-600 dark:text-indigo-400">Planners</span>
        </p>
        {showTagline && (
          <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
            Discover. Register. Attend.
          </p>
        )}
      </div>
    </div>
  );
}
