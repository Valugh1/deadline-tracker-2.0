'use client';

import { useState } from 'react';
import { X, User, Shield, Sliders, AlertTriangle, Moon, Sun } from 'lucide-react';
import { updateUserProfile, updateUserPassword, deleteUserAccount } from '@/actions/auth';
import { signOut } from 'next-auth/react';
import { UserProfile } from '@/types';
import { useTheme } from '@/components/theme-provider';

export type SettingsTab = 'profile' | 'security' | 'preferences';

interface SettingsModalProps {
  initialTab?: SettingsTab;
  currentUser: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  userProfile?: UserProfile | null;
  onClose: () => void;
}

export default function SettingsModal({
  initialTab = 'profile',
  currentUser,
  userProfile,
  onClose,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const { theme, setTheme } = useTheme();

  // Profile Form State
  const [name, setName] = useState(userProfile?.name || currentUser.name || '');
  const [email, setEmail] = useState(userProfile?.email || currentUser.email || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Preferences Form State
  const [timezone, setTimezone] = useState(userProfile?.timezone || 'Europe/Rome');
  const [notifyExpiring, setNotifyExpiring] = useState(userProfile?.notifyExpiring ?? true);
  const [notifyExpired, setNotifyExpired] = useState(userProfile?.notifyExpired ?? true);
  const [notifyDailyReset, setNotifyDailyReset] = useState(userProfile?.notifyDailyReset ?? false);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefMessage, setPrefMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete Account State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);

    const res = await updateUserProfile({
      name,
      email,
      timezone,
      notifyExpiring,
      notifyExpired,
      notifyDailyReset,
    });

    setProfileSaving(false);
    if (res.error) {
      setProfileMessage({ type: 'error', text: res.error });
    } else {
      setProfileMessage({ type: 'success', text: 'Profilo aggiornato con successo!' });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Le nuove password non corrispondono.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'La nuova password deve contenere almeno 6 caratteri.' });
      return;
    }

    setPasswordSaving(true);
    setPasswordMessage(null);

    const res = await updateUserPassword({
      currentPassword,
      newPassword,
    });

    setPasswordSaving(false);
    if (res.error) {
      setPasswordMessage({ type: 'error', text: res.error });
    } else {
      setPasswordMessage({ type: 'success', text: 'Password aggiornata con successo!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrefSaving(true);
    setPrefMessage(null);

    const res = await updateUserProfile({
      name,
      email,
      timezone,
      notifyExpiring,
      notifyExpired,
      notifyDailyReset,
    });

    setPrefSaving(false);
    if (res.error) {
      setPrefMessage({ type: 'error', text: res.error });
    } else {
      setPrefMessage({ type: 'success', text: 'Preferenze salvate con successo!' });
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const res = await deleteUserAccount();
    if (res.success) {
      signOut({ callbackUrl: '/register' });
    } else {
      alert(res.error || 'Impossibile eliminare l account.');
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-elevated rounded-3xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            Impostazioni Account
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-500/20 transition-colors cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mb-6 glass-surface rounded-2xl p-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'hover:bg-slate-500/10'
            }`}
            style={activeTab !== 'profile' ? { color: 'var(--text-secondary)' } : undefined}
          >
            <User className="w-4 h-4" />
            Profilo
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'hover:bg-slate-500/10'
            }`}
            style={activeTab !== 'security' ? { color: 'var(--text-secondary)' } : undefined}
          >
            <Shield className="w-4 h-4" />
            Sicurezza
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'preferences'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'hover:bg-slate-500/10'
            }`}
            style={activeTab !== 'preferences' ? { color: 'var(--text-secondary)' } : undefined}
          >
            <Sliders className="w-4 h-4" />
            Preferenze
          </button>
        </div>

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileMessage && (
              <div
                className={`p-3 rounded-xl text-xs sm:text-sm border ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                }`}
              >
                {profileMessage.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Nome completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 kairon-input rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 kairon-input rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              {profileSaving ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </form>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordMessage && (
              <div
                className={`p-3 rounded-xl text-xs sm:text-sm border ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                }`}
              >
                {passwordMessage.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Password attuale
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 kairon-input rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Nuova password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Minimo 6 caratteri"
                className="w-full px-4 py-2.5 kairon-input rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Conferma nuova password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Ripeti la nuova password"
                className="w-full px-4 py-2.5 kairon-input rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              {passwordSaving ? 'Aggiornamento...' : 'Aggiorna Password'}
            </button>

            {/* Danger zone */}
            <div className="pt-6 border-t mt-6" style={{ borderColor: 'var(--border-subtle)' }}>
              <h4 className="text-sm font-bold text-rose-400 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Zona pericolosa
              </h4>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                L&apos;eliminazione dell&apos;account è permanente e cancellerà tutte le tue attività e dati.
              </p>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold rounded-xl transition-all text-sm border border-rose-500/30 cursor-pointer"
                >
                  Elimina Account
                </button>
              ) : (
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl space-y-2">
                  <p className="text-xs text-rose-300 font-medium text-center">
                    Sei sicuro? Questa azione non può essere annullata.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 glass-surface rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Annulla
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={handleDeleteAccount}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      {deleting ? 'Eliminazione...' : 'Conferma Eliminazione'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        )}

        {/* PREFERENCES TAB */}
        {activeTab === 'preferences' && (
          <form onSubmit={handlePreferencesSubmit} className="space-y-5">
            {prefMessage && (
              <div
                className={`p-3 rounded-xl text-xs sm:text-sm border ${
                  prefMessage.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                }`}
              >
                {prefMessage.text}
              </div>
            )}

            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Tema Interfaccia
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 font-bold'
                      : 'glass-surface opacity-75 hover:opacity-100'
                  }`}
                >
                  <Moon className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Modalità Notte</div>
                    <div className="text-xs opacity-75">Predefinita (Obsidian)</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-500 font-bold'
                      : 'glass-surface opacity-75 hover:opacity-100'
                  }`}
                >
                  <Sun className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Modalità Giorno</div>
                    <div className="text-xs opacity-75">Chiara (Alabaster)</div>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Fuso orario
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-2.5 kairon-input rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
              >
                <option value="Europe/Rome">Europa/Roma (CET/CEST)</option>
                <option value="Europe/London">Europa/Londra (GMT/BST)</option>
                <option value="America/New_York">America/New York (EST/EDT)</option>
                <option value="UTC">UTC</option>
              </select>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Usato per sincronizzare le notifiche e il reset a mezzanotte.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Notifiche in-app
              </label>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 glass-surface rounded-xl cursor-pointer hover:border-indigo-500/40 transition-colors">
                  <span className="text-sm">Attività in scadenza</span>
                  <input
                    type="checkbox"
                    checked={notifyExpiring}
                    onChange={(e) => setNotifyExpiring(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between p-3 glass-surface rounded-xl cursor-pointer hover:border-indigo-500/40 transition-colors">
                  <span className="text-sm">Attività scadute</span>
                  <input
                    type="checkbox"
                    checked={notifyExpired}
                    onChange={(e) => setNotifyExpired(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between p-3 glass-surface rounded-xl cursor-pointer hover:border-indigo-500/40 transition-colors">
                  <span className="text-sm">Avviso reset giornaliere completato</span>
                  <input
                    type="checkbox"
                    checked={notifyDailyReset}
                    onChange={(e) => setNotifyDailyReset(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={prefSaving}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              {prefSaving ? 'Salvataggio...' : 'Salva Preferenze'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
