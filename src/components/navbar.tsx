'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { User, Shield, Sliders, LogOut } from 'lucide-react';
import SettingsModal, { SettingsTab } from '@/components/settings/settings-modal';
import { UserProfile } from '@/types';

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

  return (
    <>
      <nav className="sticky top-0 z-40 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo without symbol beside it, as requested */}
          <span className="text-xl font-bold tracking-tight text-white select-none">
            Kairon
          </span>

          <div className="flex items-center gap-4 relative" ref={menuRef}>
            <span className="text-sm text-slate-400 hidden sm:block">
              {user.email}
            </span>

            {/* Avatar Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md hover:scale-105 active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-emerald-400"
              aria-label="Menu utente"
            >
              {getInitials(user.name, user.email)}
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-4 border-b border-slate-700/40">
                  <p className="font-semibold text-white text-sm truncate">
                    {user.name || 'Utente Kairon'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{user.email}</p>
                </div>

                <div className="p-2 space-y-1">
                  <button
                    onClick={() => openSettings('profile')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors text-left"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    Modifica Profilo
                  </button>

                  <button
                    onClick={() => openSettings('security')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors text-left"
                  >
                    <Shield className="w-4 h-4 text-slate-400" />
                    Sicurezza & Password
                  </button>

                  <button
                    onClick={() => openSettings('preferences')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors text-left"
                  >
                    <Sliders className="w-4 h-4 text-slate-400" />
                    Preferenze
                  </button>
                </div>

                <div className="p-2 border-t border-slate-700/40">
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors text-left"
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
