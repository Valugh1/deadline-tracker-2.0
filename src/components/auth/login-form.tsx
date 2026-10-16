'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export default function LoginForm() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Email o password non corretti.');
        setIsLoading(false);
      } else {
        router.push('/board');
        router.refresh();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Si è verificato un errore durante l accesso.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative">
      {/* Top Right Theme Toggle */}
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="glass-surface px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold hover:scale-105 transition-all cursor-pointer"
        >
          {theme === 'dark' ? (
            <span className="flex items-center gap-1.5 text-indigo-400">
              <Moon className="w-3.5 h-3.5" /> Notte
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-500">
              <Sun className="w-3.5 h-3.5" /> Giorno
            </span>
          )}
        </button>
      </div>

      {/* Branding */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Kairon
          </h1>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            2.0
          </span>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Traccia le tue scadenze e attività, ogni giorno
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex glass-surface rounded-2xl p-1 mb-6 shadow-lg">
        <button
          type="button"
          className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
        >
          Accedi
        </button>
        <Link
          href="/register"
          className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 text-center hover:bg-slate-500/10"
          style={{ color: 'var(--text-secondary)' }}
        >
          Registrati
        </Link>
      </div>

      {/* Form Card */}
      <div className="glass-elevated rounded-3xl p-6 sm:p-8 shadow-2xl">
        {error && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs sm:text-sm text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@email.com"
              required
              className="w-full px-4 py-3 kairon-input rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 kairon-input rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
                aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 active:scale-[0.98] text-sm mt-2 cursor-pointer"
          >
            {isLoading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>
      </div>

      <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
        Kairon — Progressive Web App per le tue scadenze
      </p>
    </div>
  );
}
