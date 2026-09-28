import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Save,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import ConfirmDialog from '../components/ConfirmDialog';
import { AlertBanner } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function PasswordField({ label, value, onChange, autoComplete, visible, onToggle, placeholder }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
      <div className="relative mt-2">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-500/20"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}

export default function AccountPage() {
  const { user, updateUser, refreshAuthentication, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forced = Boolean(user?.must_change_password) || searchParams.get('forcePassword') === '1';
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [message, setMessage] = useState(null);
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false, delete: false });

  const roleLabel = useMemo(() => user?.role === 'admin' ? 'Administrator' : 'Attendee', [user?.role]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setMessage(null);
    setProfileBusy(true);
    try {
      const response = await api.patch('/account/profile', profile);
      updateUser(response.data.user);
      setMessage({ tone: 'success', text: response.data.message });
    } catch (error) {
      setMessage({ tone: 'error', text: error.response?.data?.message || 'Unable to update your profile.' });
    } finally {
      setProfileBusy(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setMessage(null);
    if (passwords.next !== passwords.confirm) {
      setMessage({ tone: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    setPasswordBusy(true);
    try {
      const response = await api.patch('/account/password', {
        current_password: passwords.current,
        new_password: passwords.next,
      });
      refreshAuthentication({ token: response.data.token, user: response.data.user });
      setPasswords({ current: '', next: '', confirm: '' });
      setMessage({ tone: 'success', text: response.data.message });
      if (forced) navigate('/account', { replace: true });
    } catch (error) {
      setMessage({ tone: 'error', text: error.response?.data?.message || 'Unable to change your password.' });
    } finally {
      setPasswordBusy(false);
    }
  };

  const deleteAccount = async () => {
    setMessage(null);
    setDeleteBusy(true);
    try {
      await api.delete('/account', { data: { password: deletePassword } });
      logout();
      navigate('/login', { replace: true, state: { accountDeleted: true } });
    } catch (error) {
      setDeleteOpen(false);
      setMessage({ tone: 'error', text: error.response?.data?.message || 'Unable to delete your account.' });
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <AppShell role={user?.role || 'user'}>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-6 py-8 text-white sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-100">Account settings</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Manage your EventoPlanners account</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">Update your personal information, keep your password secure, or close your account.</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-100">Role</p>
                <p className="mt-1 font-bold">{roleLabel}</p>
              </div>
            </div>
          </div>
        </section>

        {forced && (
          <AlertBanner tone="warning">
            <strong>Password change required.</strong> Your password was reset by an administrator. Choose a new password before continuing to other areas of the system.
          </AlertBanner>
        )}
        {message && <AlertBanner tone={message.tone}>{message.text}</AlertBanner>}

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"><UserRound size={22} /></div>
              <div><h3 className="text-xl font-black text-slate-950 dark:text-white">Profile information</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your name and email are used throughout registrations and account screens.</p></div>
            </div>
            <form onSubmit={saveProfile} className="mt-6 space-y-5">
              <label className="block"><span className="text-sm font-bold text-slate-700 dark:text-slate-200">Full name</span><input required minLength={2} maxLength={100} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-500/20" /></label>
              <label className="block"><span className="text-sm font-bold text-slate-700 dark:text-slate-200">Email address</span><input required type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-500/20" /></label>
              <button disabled={profileBusy || forced} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"><Save size={17} />{profileBusy ? 'Saving...' : 'Save profile'}</button>
              {forced && <p className="text-xs text-amber-600 dark:text-amber-300">Profile editing is temporarily disabled until you change the reset password.</p>}
            </form>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"><KeyRound size={22} /></div>
              <div><h3 className="text-xl font-black text-slate-950 dark:text-white">Change password</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use at least 8 characters. You must know your current password.</p></div>
            </div>
            <form onSubmit={changePassword} className="mt-6 space-y-5">
              <PasswordField label="Current password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} autoComplete="current-password" visible={showPasswords.current} onToggle={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })} placeholder="Enter current password" />
              <PasswordField label="New password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} autoComplete="new-password" visible={showPasswords.next} onToggle={() => setShowPasswords({ ...showPasswords, next: !showPasswords.next })} placeholder="At least 8 characters" />
              <PasswordField label="Confirm new password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} autoComplete="new-password" visible={showPasswords.confirm} onToggle={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })} placeholder="Repeat new password" />
              <button disabled={passwordBusy} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-50">{passwordBusy ? <LoaderCircle size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}{passwordBusy ? 'Changing...' : 'Change password'}</button>
            </form>
          </section>
        </div>

        <section className="rounded-[1.75rem] border border-red-200 bg-red-50/70 p-6 dark:border-red-900/60 dark:bg-red-950/20 sm:p-7">
          <div className="flex items-start gap-3"><div className="rounded-2xl bg-red-100 p-3 text-red-700 dark:bg-red-500/10 dark:text-red-300"><AlertTriangle size={22} /></div><div><h3 className="text-xl font-black text-red-950 dark:text-red-100">Delete account</h3><p className="mt-1 max-w-3xl text-sm leading-6 text-red-700 dark:text-red-300">This permanently disables your login and anonymizes your account. Historical registration and payment records are retained so event reports remain accurate.</p></div></div>
          <div className="mt-5 max-w-md">
            <PasswordField label="Current password to confirm deletion" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} autoComplete="current-password" visible={showPasswords.delete} onToggle={() => setShowPasswords({ ...showPasswords, delete: !showPasswords.delete })} placeholder="Enter current password" />
            <button type="button" disabled={!deletePassword || forced} onClick={() => setDeleteOpen(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 size={17} />Delete my account</button>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete your account?"
        message="You will immediately lose access to EventoPlanners. Your personal account details will be anonymized, while historical event records will remain for reporting."
        confirmLabel={deleteBusy ? 'Deleting...' : 'Delete account'}
        cancelLabel="Keep account"
        danger
        busy={deleteBusy}
        onCancel={() => !deleteBusy && setDeleteOpen(false)}
        onConfirm={deleteAccount}
      />
    </AppShell>
  );
}
