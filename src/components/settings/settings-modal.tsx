'use client';

import { useState } from 'react';
import { X, User, Shield, Sliders, Check, AlertTriangle } from 'lucide-react';
import { updateUserProfile, updateUserPassword, deleteUserAccount } from '@/actions/auth';
import { signOut } from 'next-auth/react';
import { UserProfile } from '@/types';

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
      <div className="bg-slate-800 border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Impostazioni
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mb-6 bg-slate-900/50 rounded-xl p-1 border border-slate-700/40">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'profile'
                ? 'bg-slate-700/70 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            Profilo
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'security'
                ? 'bg-slate-700/70 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Sicurezza
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'preferences'
                ? 'bg-slate-700/70 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
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
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/15 border-red-500/30 text-red-300'
                }`}
              >
                {profileMessage.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Nome completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm shadow-md shadow-indigo-500/20"
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
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/15 border-red-500/30 text-red-300'
                }`}
              >
                {passwordMessage.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password attuale
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Nuova password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Minimo 6 caratteri"
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Conferma nuova password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Ripeti la nuova password"
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm shadow-md shadow-indigo-500/20"
            >
              {passwordSaving ? 'Aggiornamento...' : 'Aggiorna Password'}
            </button>

            {/* Danger zone */}
            <div className="pt-6 border-t border-slate-700/50 mt-6">
              <h4 className="text-sm font-bold text-red-400 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Zona pericolosa
              </h4>
              <p className="text-xs text-slate-400 mb-3">
                L eliminazione dell account è permanente e cancellerà tutte le tue attività e dati.
              </p>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-xl transition-all text-sm border border-red-500/30"
                >
                  Elimina Account
                </button>
              ) : (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl space-y-2">
                  <p className="text-xs text-red-300 font-medium text-center">
                    Sei sicuro? Questa azione non può essere annullata.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                    >
                      Annulla
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={handleDeleteAccount}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold"
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
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/15 border-red-500/30 text-red-300'
                }`}
              >
                {prefMessage.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Fuso orario
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              >
                <option value="Europe/Rome">Europa/Roma (CET/CEST)</option>
                <option value="Europe/London">Europa/Londra (GMT/BST)</option>
                <option value="America/New_York">America/New York (EST/EDT)</option>
                <option value="UTC">UTC</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Usato per sincronizzare le notifiche e il reset a mezzanotte.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Notifiche in-app
              </label>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-700/40 rounded-xl cursor-pointer hover:bg-slate-900/60 transition-colors">
                  <span className="text-sm text-slate-300">Attività in scadenza</span>
                  <input
                    type="checkbox"
                    checked={notifyExpiring}
                    onChange={(e) => setNotifyExpiring(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-700/40 rounded-xl cursor-pointer hover:bg-slate-900/60 transition-colors">
                  <span className="text-sm text-slate-300">Attività scadute</span>
                  <input
                    type="checkbox"
                    checked={notifyExpired}
                    onChange={(e) => setNotifyExpired(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-700/40 rounded-xl cursor-pointer hover:bg-slate-900/60 transition-colors">
                  <span className="text-sm text-slate-300">Avviso reset giornaliere completato</span>
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
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm shadow-md shadow-indigo-500/20"
            >
              {prefSaving ? 'Salvataggio...' : 'Salva Preferenze'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
