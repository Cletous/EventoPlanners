import {
  Check,
  Clipboard,
  KeyRound,
  Search,
  ShieldCheck,
  ShieldOff,
  UserRoundCog,
  UsersRound,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import AppShell from '../components/AppShell';
import ConfirmDialog from '../components/ConfirmDialog';
import { AlertBanner, EmptyState, LoadingState } from '../components/ui/Feedback';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function roleLabel(role) {
  return role === 'admin' ? 'Administrator' : 'User';
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-ZW', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function UserIdentity({ user }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-sm font-black text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
        {String(user.name || 'U').charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate font-extrabold text-slate-950 dark:text-white">{user.name}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
        <p className="mt-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">User #{user.id}</p>
      </div>
    </div>
  );
}

function TemporaryPasswordDialog({ open, result, onClose }) {
  const closeRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    setCopied(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !result) return null;

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(result.temporary_password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="temporary-password-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            <KeyRound size={24} />
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white" aria-label="Close temporary password dialog">
            <X size={20} />
          </button>
        </div>

        <h2 id="temporary-password-title" className="mt-5 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Temporary password created</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Give this password securely to <strong>{result.user.name}</strong>. It is shown only in this response and cannot be recovered later.
        </p>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/25 dark:bg-amber-500/10">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Temporary password</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 break-all rounded-xl bg-white px-4 py-3 text-base font-black tracking-wide text-slate-950 ring-1 ring-amber-200 dark:bg-slate-950 dark:text-white dark:ring-amber-500/25">{result.temporary_password}</code>
            <button type="button" onClick={copyPassword} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 dark:focus-visible:ring-amber-500/20">
              {copied ? <Check size={17} /> : <Clipboard size={17} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <AlertBanner tone="warning" className="mt-5">
          The user will be forced to change this temporary password immediately after their next login before they can access the rest of EventoPlanners.
        </AlertBanner>

        <button type="button" onClick={onClose} className="mt-6 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
          I have saved the password
        </button>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('active');
  const [appliedFilters, setAppliedFilters] = useState({ search: '', role: '', status: 'active' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [roleTarget, setRoleTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [temporaryResult, setTemporaryResult] = useState(null);

  const loadUsers = async (filters = appliedFilters) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/users', { params: filters });
      setUsers(response.data.users || []);
      setAppliedFilters(filters);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers({ search: '', role: '', status: 'active' });
    // Initial user directory load only; later filtering is explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => ({
    total: users.length,
    admins: users.filter((item) => item.role === 'admin').length,
    forced: users.filter((item) => item.must_change_password).length,
    registrations: users.reduce((sum, item) => sum + Number(item.registration_count || 0), 0),
  }), [users]);

  const applyFilters = async (event) => {
    event.preventDefault();
    await loadUsers({ search: search.trim(), role, status });
  };

  const clearFilters = async () => {
    setSearch('');
    setRole('');
    setStatus('active');
    await loadUsers({ search: '', role: '', status: 'active' });
  };

  const confirmRoleChange = async () => {
    if (!roleTarget) return;
    const nextRole = roleTarget.role === 'admin' ? 'user' : 'admin';
    setBusyId(roleTarget.id);
    setMessage('');
    try {
      const response = await api.patch(`/admin/users/${roleTarget.id}/role`, { role: nextRole });
      setMessage(response.data.message);
      setRoleTarget(null);
      await loadUsers(appliedFilters);
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || 'Unable to update the user role.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmPasswordReset = async () => {
    if (!resetTarget) return;
    setBusyId(resetTarget.id);
    setMessage('');
    try {
      const response = await api.post(`/admin/users/${resetTarget.id}/reset-password`);
      setTemporaryResult(response.data);
      setResetTarget(null);
      await loadUsers(appliedFilters);
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || 'Unable to reset the password.');
    } finally {
      setBusyId(null);
    }
  };

  const isSelf = (item) => Number(item.id) === Number(currentUser?.id);

  return (
    <AppShell role="admin">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-6 py-7 text-white sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-100">Identity & access</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Manage users</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">Review accounts, assign administrator access, and securely reset passwords when users lose access.</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-100">Current directory</p>
                <p className="mt-1 text-2xl font-black">{summary.total}</p>
              </div>
            </div>
          </div>
        </section>

        {message && <AlertBanner tone={message.toLowerCase().includes('unable') || message.toLowerCase().includes('cannot') ? 'error' : 'success'}>{message}</AlertBanner>}
        {error && <AlertBanner tone="error" action={<button type="button" onClick={() => loadUsers(appliedFilters)} className="font-extrabold underline underline-offset-2">Retry</button>}>{error}</AlertBanner>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Visible accounts', summary.total, UsersRound, 'text-indigo-600 dark:text-indigo-300', 'bg-indigo-50 dark:bg-indigo-500/10'],
            ['Administrators', summary.admins, ShieldCheck, 'text-violet-600 dark:text-violet-300', 'bg-violet-50 dark:bg-violet-500/10'],
            ['Password change required', summary.forced, KeyRound, 'text-amber-600 dark:text-amber-300', 'bg-amber-50 dark:bg-amber-500/10'],
            ['Registrations owned', summary.registrations, UserRoundCog, 'text-emerald-600 dark:text-emerald-300', 'bg-emerald-50 dark:bg-emerald-500/10'],
          ].map(([label, value, Icon, iconClass, bgClass]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${bgClass} ${iconClass}`}><Icon size={21} /></div>
              <p className="mt-4 text-2xl font-black text-slate-950 dark:text-white">{value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5">
            <form onSubmit={applyFilters} className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_190px_190px_auto]">
              <label className="relative block">
                <span className="sr-only">Search users</span>
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or user ID" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20" />
              </label>
              <select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-500/20" aria-label="Role filter">
                <option value="">All roles</option>
                <option value="admin">Administrators</option>
                <option value="user">Users</option>
              </select>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20" aria-label="Account status filter">
                <option value="active">Active accounts</option>
                <option value="deleted">Deleted accounts</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 xl:flex-none"><Search size={16} />Apply</button>
                <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Clear</button>
              </div>
            </form>
          </div>

          {loading ? (
            <div className="p-5"><LoadingState label="Loading users..." /></div>
          ) : users.length === 0 ? (
            <div className="p-5"><EmptyState icon={UsersRound} title="No users found" description="Try changing the search or role/status filters." /></div>
          ) : (
            <>
              <div className="space-y-3 p-4 lg:hidden">
                {users.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-950/30">
                    <UserIdentity user={item} />
                    <div className="mt-4 flex flex-wrap gap-2">
                      <StatusBadge tone={item.role === 'admin' ? 'violet' : 'info'}>{roleLabel(item.role)}</StatusBadge>
                      <StatusBadge tone={item.active ? 'success' : 'danger'}>{item.active ? 'Active' : 'Deleted'}</StatusBadge>
                      {item.must_change_password && <StatusBadge tone="warning">Password change required</StatusBadge>}
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Registrations</dt><dd className="mt-1 font-extrabold text-slate-900 dark:text-white">{item.registration_count}</dd></div>
                      <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Joined</dt><dd className="mt-1 font-semibold text-slate-700 dark:text-slate-200">{formatDate(item.created_at)}</dd></div>
                    </dl>
                    {item.active && !isSelf(item) && (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <button type="button" onClick={() => setRoleTarget(item)} disabled={busyId === item.id} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                          {item.role === 'admin' ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}{item.role === 'admin' ? 'Make user' : 'Make admin'}
                        </button>
                        <button type="button" onClick={() => setResetTarget(item)} disabled={busyId === item.id} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-amber-700 disabled:opacity-50"><KeyRound size={16} />Reset password</button>
                      </div>
                    )}
                    {isSelf(item) && <p className="mt-4 text-xs font-semibold text-slate-400">Manage your own role/password from another administrator account or My account.</p>}
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto lg:block [isolation:isolate]">
                <table className="min-w-[1120px] w-full border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="text-xs font-extrabold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      <th className="sticky left-0 z-20 w-[300px] min-w-[300px] border-b border-slate-200 bg-slate-50 px-5 py-3.5 shadow-[8px_0_14px_-12px_rgba(15,23,42,0.5)] dark:border-slate-800 dark:bg-slate-900">User</th>
                      <th className="border-b border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">Role</th>
                      <th className="border-b border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">Account</th>
                      <th className="border-b border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">Registrations</th>
                      <th className="border-b border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">Joined</th>
                      <th className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 text-right dark:border-slate-800 dark:bg-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((item) => (
                      <tr key={item.id} className="group">
                        <td className="sticky left-0 z-10 w-[300px] min-w-[300px] border-b border-slate-100 bg-white px-5 py-4 shadow-[8px_0_14px_-12px_rgba(15,23,42,0.5)] group-hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:group-hover:bg-slate-800/70"><UserIdentity user={item} /></td>
                        <td className="border-b border-slate-100 px-4 py-4 dark:border-slate-800"><StatusBadge tone={item.role === 'admin' ? 'violet' : 'info'}>{roleLabel(item.role)}</StatusBadge></td>
                        <td className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
                          <div className="flex flex-col items-start gap-2"><StatusBadge tone={item.active ? 'success' : 'danger'}>{item.active ? 'Active' : 'Deleted'}</StatusBadge>{item.must_change_password && <StatusBadge tone="warning">Change required</StatusBadge>}</div>
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4 dark:border-slate-800"><p className="font-extrabold text-slate-950 dark:text-white">{item.registration_count}</p><p className="mt-0.5 text-xs text-slate-400">{item.confirmed_registration_count} confirmed</p></td>
                        <td className="border-b border-slate-100 px-4 py-4 font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">{formatDate(item.created_at)}</td>
                        <td className="border-b border-slate-100 px-5 py-4 text-right dark:border-slate-800">
                          {item.active && !isSelf(item) ? (
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => setRoleTarget(item)} disabled={busyId === item.id} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">{item.role === 'admin' ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}{item.role === 'admin' ? 'Make user' : 'Make admin'}</button>
                              <button type="button" onClick={() => setResetTarget(item)} disabled={busyId === item.id} className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-700 disabled:opacity-50"><KeyRound size={15} />Reset password</button>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">{isSelf(item) ? 'Current account' : 'No actions'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(roleTarget)}
        title={roleTarget?.role === 'admin' ? 'Remove administrator access?' : 'Assign administrator access?'}
        message={roleTarget ? `${roleTarget.name} will ${roleTarget.role === 'admin' ? 'lose administrator privileges and become a standard user' : 'gain full administrator access to events, users, payments, reports and other administrative functions'}.` : ''}
        confirmLabel={roleTarget?.role === 'admin' ? 'Make standard user' : 'Make administrator'}
        danger={roleTarget?.role === 'admin'}
        busy={Boolean(roleTarget && busyId === roleTarget.id)}
        onCancel={() => !busyId && setRoleTarget(null)}
        onConfirm={confirmRoleChange}
      />

      <ConfirmDialog
        open={Boolean(resetTarget)}
        title="Reset this user's password?"
        message={resetTarget ? `A new temporary password will replace ${resetTarget.name}'s current password. They will be forced to create a new password on their next login.` : ''}
        confirmLabel="Reset password"
        busy={Boolean(resetTarget && busyId === resetTarget.id)}
        onCancel={() => !busyId && setResetTarget(null)}
        onConfirm={confirmPasswordReset}
      />

      <TemporaryPasswordDialog open={Boolean(temporaryResult)} result={temporaryResult} onClose={() => setTemporaryResult(null)} />
    </AppShell>
  );
}
