import { CalendarDays, LogOut, Search, ShieldCheck, TicketCheck, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function DashboardPage({ admin = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [adminCheck, setAdminCheck] = useState(admin ? 'Checking administrator permission...' : '');

  useEffect(() => {
    if (!admin) return;

    api.get('/admin/check')
      .then((response) => setAdminCheck(response.data.message))
      .catch((error) => setAdminCheck(error.response?.data?.message || 'Administrator access check failed.'));
  }, [admin]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Logo compact />
          <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><LogOut size={17} /> Logout</button>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">{admin ? <ShieldCheck size={24} /> : <UserRound size={24} />}</div>
          <div className="mt-5 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold tracking-tight text-slate-950">Welcome, {user.name}</h1><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-violet-700">{user.role}</span></div>
          <p className="mt-2 text-slate-500">{admin ? 'Manage EventoPlanners events and administration tasks from this area.' : 'Discover and view events currently published on EventoPlanners.'}</p>
          {admin && <div className="mt-6 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">{adminCheck}</div>}

          {admin ? (
            <Link to="/admin/events" className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 transition hover:border-indigo-200 hover:bg-indigo-100/70">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm"><CalendarDays size={22} /></div>
                <div><p className="font-bold text-slate-950">Manage events</p><p className="mt-1 text-sm text-slate-600">Create, edit, publish, close, search and delete eligible events.</p></div>
              </div>
              <span className="text-sm font-bold text-indigo-700">Open →</span>
            </Link>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Link to="/user/events" className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 transition hover:border-indigo-200 hover:bg-indigo-100/70">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm"><Search size={22} /></div>
                  <div><p className="font-bold text-slate-950">Browse events</p><p className="mt-1 text-sm text-slate-600">Search published events and register for an available event.</p></div>
                </div>
                <span className="text-sm font-bold text-indigo-700">Browse →</span>
              </Link>
              <Link to="/user/registrations" className="flex items-center justify-between gap-4 rounded-2xl border border-violet-100 bg-violet-50 p-5 transition hover:border-violet-200 hover:bg-violet-100/70">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm"><TicketCheck size={22} /></div>
                  <div><p className="font-bold text-slate-950">My registrations</p><p className="mt-1 text-sm text-slate-600">View confirmed, pending-payment and cancelled registrations.</p></div>
                </div>
                <span className="text-sm font-bold text-violet-700">View →</span>
              </Link>
            </div>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5"><p className="text-sm font-semibold text-slate-500">Signed in as</p><p className="mt-1 font-semibold text-slate-900">{user.email}</p></div>
            <div className="rounded-2xl bg-slate-50 p-5"><p className="text-sm font-semibold text-slate-500">Role access</p><p className="mt-1 font-semibold text-slate-900">{admin ? 'Administrator area' : 'Attendee area'}</p></div>
          </div>
        </div>
      </div>
    </main>
  );
}
