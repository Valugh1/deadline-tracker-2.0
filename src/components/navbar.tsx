'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { User, Shield, Sliders, LogOut, Moon, Sun, ChevronDown } from 'lucide-react';
import SettingsModal, { SettingsTab } from '@/components/settings/settings-modal';
import { UserProfile } from '@/types';
import { useTheme } from '@/components/theme-provider';

interface NavbarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  userProfile?: UserProfile | null;
}

export default function Navbar({ user, userProfile }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('profile');
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openSettings = (tab: SettingsTab) => {
    setActiveSettingsTab(tab);
    setSettingsOpen(true);
    setMenuOpen(false);
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name?.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'KP';
  };

  const displayName = userProfile?.name || user.name || user.email?.split('@')[0] || 'Utente';

  return (
    <>
      <nav className="sticky top-0 z-40 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo without symbol beside it, as requested */}
          <div className="flex items-center gap-2.5">
            <span className="text-xl font-extrabold tracking-tight select-none" style={{ color: 'var(--text-primary)' }}>
              Kairon
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 select-none">
              2.0
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 relative" ref={menuRef}>
            {/* Night / Day Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="glass-surface px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Cambia tra Modalità Notte e Modalità Giorno"
              aria-label="Cambia tema"
            >
              {theme === 'dark' ? (
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <Moon className="w-4 h-4" />
                  <span className="hidden sm:inline">Notte</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-500">
                  <Sun className="w-4 h-4" />
                  <span className="hidden sm:inline">Giorno</span>
                </span>
              )}
            </button>

            {/* User Profile Pill Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="glass-surface pl-1.5 pr-3 py-1 rounded-full flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400/50 cursor-pointer"
              aria-label="Menu utente"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow">
                {getInitials(userProfile?.name || user.name, user.email)}
              </div>
              <span className="text-xs font-semibold hidden sm:inline max-w-[120px] truncate" style={{ color: 'var(--text-primary)' }}>
                {displayName}
              </span>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 glass-elevated rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {userProfile?.name || user.name || 'Utente Kairon'}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                    {user.email}
                  </p>
                </div>

                <div className="p-2 space-y-1">
                  <button
                    onClick={() => openSettings('profile')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-indigo-500/10 rounded-xl transition-colors text-left cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <User className="w-4 h-4 text-indigo-400" />
                    Modifica Profilo
                  </button>

                  <button
                    onClick={() => openSettings('security')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-indigo-500/10 rounded-xl transition-colors text-left cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Sicurezza & Password
                  </button>

                  <button
                    onClick={() => openSettings('preferences')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-indigo-500/10 rounded-xl transition-colors text-left cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <Sliders className="w-4 h-4 text-amber-400" />
                    Preferenze
                  </button>

                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-indigo-500/10 rounded-xl transition-colors text-left cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span className="flex items-center gap-3">
                      {theme === 'dark' ? (
                        <Moon className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Sun className="w-4 h-4 text-amber-500" />
                      )}
                      <span>Tema: {theme === 'dark' ? 'Notte' : 'Giorno'}</span>
                    </span>
                    <span className="text-xs font-semibold text-indigo-400">Cambia</span>
                  </button>
                </div>

                <div className="p-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          initialTab={activeSettingsTab}
          userProfile={userProfile}
          currentUser={user}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}
