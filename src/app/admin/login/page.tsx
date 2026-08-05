"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { HiEye, HiEyeSlash } from 'react-icons/hi2';

export const dynamic = 'force-dynamic';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let isMounted = true;
    async function checkExistingAuth() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/auth/verify', {
          headers,
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            const redirect = searchParams.get('redirect') || '/admin/dashboard';
            router.replace(redirect);
            return;
          }
        }
      } catch {
        // Not authenticated or network error, proceed to show login form
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    }

    checkExistingAuth();
    return () => { isMounted = false; };
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        if (data.token) {
          try {
            localStorage.setItem('admin_token', data.token);
          } catch {}
        }
        const redirect = searchParams.get('redirect') || '/admin/dashboard';
        router.push(redirect);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-magenta/30 border-t-magenta rounded-full animate-spin mx-auto" />
          <p className="font-mono text-xs text-warm-gray/60 uppercase tracking-wider">Verifying Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-rich-black">
            Admin <span className="text-magenta/60">Login</span>
          </h1>
          <p className="mt-2 font-sans text-sm text-warm-gray/60">
            Indira Thakur Photography
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-sm border border-cream/50 space-y-6 shadow-sm">
          {error && (
            <div className="p-4 bg-magenta/10 border border-magenta/10 text-magenta font-sans text-sm rounded-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-white border border-beige/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all duration-500 focus:outline-none focus:border-magenta/40"
              placeholder="admin@indirathakur.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 pr-12 bg-white border border-beige/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all duration-500 focus:outline-none focus:border-magenta/40"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray/60 hover:text-rich-black p-1 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <HiEyeSlash className="w-5 h-5" />
                ) : (
                  <HiEye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-warm-gray/80 hover:text-rich-black transition-colors">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-beige/80 text-magenta focus:ring-magenta/30 cursor-pointer accent-magenta"
              />
              <span>Remember me for 30 days</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-ivory">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}