'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
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
    <div className="w-full max-w-md mx-auto">
      {/* Branding */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          Kairon
        </h1>
        <p className="text-slate-400 text-sm">
          Traccia le tue scadenze e attività, ogni giorno
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-slate-800/80 rounded-2xl p-1 mb-6 border border-slate-700/60 shadow-lg">
        <button
          type="button"
          className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 bg-indigo-600 text-white shadow-md"
        >
          Accedi
        </button>
        <Link
          href="/register"
          className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 text-slate-400 hover:text-slate-200 text-center"
        >
          Registrati
        </Link>
      </div>

      {/* Form Card */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-2xl">
        {error && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs sm:text-sm text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@email.com"
              required
              className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 active:scale-[0.98] text-sm mt-2"
          >
            {isLoading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>
      </div>

      <p className="text-center text-slate-500 text-xs mt-6">
        Kairon — Progressive Web App per le tue scadenze
      </p>
    </div>
  );
}
