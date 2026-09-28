import {
  CalendarDays,
  ChevronRight,
  CreditCard,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  TicketCheck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const THEME_KEY = 'eventoplanners_theme';

const adminNavigation = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Events', to: '/admin/events', icon: CalendarDays },
  { label: 'Registrations', to: '/admin/registrations', icon: TicketCheck },
  { label: 'Payments', to: '/admin/payments', icon: CreditCard },
  { label: 'Reports', to: '/admin/reports', icon: FileBarChart },
];

const userNavigation = [
  { label: 'Dashboard', to: '/user/dashboard', icon: LayoutDashboard },
  { label: 'Browse events', to: '/user/events', icon: CalendarDays },
  { label: 'My registrations', to: '/user/registrations', icon: TicketCheck },
];

function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function NavigationLink({ item, collapsed, onNavigate }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
          collapsed ? 'justify-center px-2' : 'gap-3 px-3'
        } ${
          isActive
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={19} strokeWidth={isActive ? 2.25 : 2} aria-hidden="true" />
          {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
          {!collapsed && isActive && <ChevronRight size={15} className="opacity-70" aria-hidden="true" />}
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({ role, collapsed, onNavigate, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navigation = role === 'admin' ? adminNavigation : userNavigation;

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-950">
      <div className={`flex h-[76px] items-center border-b border-slate-200/80 dark:border-slate-800 ${collapsed ? 'justify-center px-3' : 'px-5'}`}>
        {collapsed ? <Logo compact showTagline={false} className="[&>div:last-child]:hidden" /> : <Logo compact />}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        {!collapsed && (
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            {role === 'admin' ? 'Administration' : 'Attendee portal'}
          </p>
        )}
        <nav className="space-y-1" aria-label="Primary navigation">
          {navigation.map((item) => (
            <NavigationLink key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-200/80 p-3 dark:border-slate-800">
        {!collapsed ? (
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-extrabold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                {String(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{user?.name}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-indigo-500/20"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-extrabold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" title={user?.name}>
              {String(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="mt-3 hidden w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white lg:flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            {!collapsed && 'Collapse sidebar'}
          </button>
        )}
      </div>
    </div>
  );
}

function routeTitle(pathname, role) {
  const navigation = role === 'admin' ? adminNavigation : userNavigation;
  return navigation.find((item) => pathname.startsWith(item.to))?.label || 'EventoPlanners';
}

export default function AppShell({ children, role }) {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  const dark = theme === 'dark';
  const title = routeTitle(location.pathname, role);

  return (
    <div className={dark ? 'dark' : ''}>
      <a href="#main-content" className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition focus:translate-y-0 focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-500/30">Skip to main content</a>
      <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <aside className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200/80 shadow-sm transition-[width] duration-200 dark:border-slate-800 lg:block ${collapsed ? 'w-20' : 'w-64'}`}>
          <SidebarContent role={role} collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            />
            <aside className="relative h-full w-[min(20rem,88vw)] border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-5 z-10 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Close navigation menu"
              >
                <X size={20} />
              </button>
              <SidebarContent role={role} collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
            <div className="flex h-[76px] items-center gap-3 px-4 sm:px-6 xl:px-8">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
                aria-label="Open navigation menu"
                aria-expanded={mobileOpen}
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0 flex-1 lg:hidden">
                <Logo compact showTagline={false} className="[&>div:last-child]:hidden sm:[&>div:last-child]:block" />
              </div>

              <div className="hidden min-w-0 flex-1 lg:block">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  {role === 'admin' ? 'Administration' : 'Attendee portal'}
                </p>
                <h1 className="mt-0.5 truncate text-lg font-bold tracking-tight text-slate-950 dark:text-white">{title}</h1>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTheme(dark ? 'light' : 'dark')}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-indigo-500/20"
                  aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                  title={dark ? 'Light mode' : 'Dark mode'}
                >
                  {dark ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-extrabold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                    {String(user?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden min-w-0 md:block">
                    <p className="max-w-40 truncate text-xs font-bold text-slate-900 dark:text-white">{user?.name}</p>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{role}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main id="main-content" tabIndex="-1" className="min-h-[calc(100vh-76px)] outline-none">
            <div className="mx-auto w-full max-w-[1560px] px-4 py-5 sm:px-6 sm:py-7 xl:px-8 xl:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
