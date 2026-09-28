import {
  CalendarDays,
  ChevronRight,
  CreditCard,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Menu,
  TicketCheck,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

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

function NavigationLink({ item, onNavigate }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
          isActive
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={19} strokeWidth={isActive ? 2.3 : 2} />
          <span className="flex-1">{item.label}</span>
          {isActive && <ChevronRight size={16} className="text-indigo-400" aria-hidden="true" />}
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({ role, onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navigation = role === 'admin' ? adminNavigation : userNavigation;

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-20 items-center border-b border-slate-100 px-5">
        <Logo compact />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
          {role === 'admin' ? 'Administration' : 'Attendee portal'}
        </p>
        <nav className="mt-3 space-y-1" aria-label="Primary navigation">
          {navigation.map((item) => (
            <NavigationLink key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-100 p-3">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{user?.name}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children, role }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 lg:block">
        <SidebarContent role={role} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="relative h-full w-[min(20rem,88vw)] border-r border-slate-200 bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-5 z-10 rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
              aria-label="Close navigation menu"
            >
              <X size={20} />
            </button>
            <SidebarContent role={role} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur lg:hidden">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <Logo compact />
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        <main className="min-h-screen">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
