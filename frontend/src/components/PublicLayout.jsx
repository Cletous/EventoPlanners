import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const THEME_KEY = 'eventoplanners_theme';

function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function PublicLayout({ children, authPage = false }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const dark = theme === 'dark';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, theme);
  }, [dark, theme]);

  const toggleTheme = () => {
    const nextTheme = dark ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-indigo-200/45 blur-3xl dark:bg-indigo-600/10" />
          <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-600/10" />
        </div>

        <header className="relative z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
          <div className="mx-auto flex h-[76px] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
            <Link to="/" className="min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-500/20" aria-label="EventoPlanners home">
              <Logo compact />
            </Link>

            <div className="ml-auto flex items-center gap-2">
              {authPage && (
                <Link
                  to="/"
                  className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-indigo-500/20 sm:inline-flex"
                >
                  <ArrowLeft size={17} />
                  Home
                </Link>
              )}

              {!authPage && (
                <>
                  <Link
                    to="/login"
                    className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-indigo-500/20 sm:inline-flex"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="hidden rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 dark:focus-visible:ring-indigo-500/30 sm:inline-flex"
                  >
                    Create account
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-indigo-500/20"
                aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={dark ? 'Light mode' : 'Dark mode'}
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-10">{children}</main>
      </div>
    </div>
  );
}
