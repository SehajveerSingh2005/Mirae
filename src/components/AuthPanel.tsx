"use client";
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { supabase } from '../utils/supabaseClient';

export default function AuthPanel({ open, onClose, theme }: { open: boolean; onClose: () => void; theme: 'light' | 'dark' | 'glass'; }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal background logic (match SettingsModal)
  let modalBg = 'var(--dropdown-bg)';
  if (theme === 'light') modalBg = 'var(--dropdown-bg, rgba(255,255,255,0.85))';
  if (theme === 'dark') modalBg = 'var(--dropdown-bg, rgba(30,30,40,0.85))';
  // glass theme uses var(--dropdown-bg)

  // Clear success and error when modal is opened or mode changes
  useEffect(() => {
    if (open) {
      setSuccess(null);
      setError(null);
      setEmail('');
      setPassword('');
    }
  }, [open]);
  useEffect(() => {
    setSuccess(null);
    setError(null);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSuccess('Logged in!');
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Check your email to confirm your account.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[8px] w-full h-full transition-all duration-200" />
      <Dialog.Panel
        className="relative rounded-2xl shadow-2xl p-8 w-full max-w-lg border flex flex-col gap-4 transition-all duration-200"
        style={{
          background: modalBg,
          color: 'var(--foreground)',
          border: '1.5px solid var(--border)',
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
          backdropFilter: 'var(--glass-blur)'
        }}
      >
        <button
          className="absolute top-3 right-3 w-10 h-10 aspect-square text-xl cursor-pointer z-10 rounded-full flex items-center justify-center transition hover:bg-[var(--button-hover-bg)]"
          style={{ color: 'var(--muted)', background: 'transparent' }}
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-2 text-center" style={{ color: 'var(--foreground)' }}>
            {mode === 'login' ? 'Sign In' : 'Sign Up'}
          </h2>
          {/* Social Login */}
          <div className="flex flex-col gap-2 mb-4">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition"
              style={{
                background: 'var(--button-bg)',
                color: 'var(--button-fg)',
                border: '1.5px solid var(--border)',
                opacity: loading ? 0.7 : 1
              }}
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setError(null);
                setSuccess(null);
                try {
                  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
                  if (error) throw error;
                } catch (err: any) {
                  setError(err.message || 'Something went wrong');
                } finally {
                  setLoading(false);
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48" className="mr-2" style={{ display: 'inline' }}><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.64 2.69 30.18 0 24 0 14.82 0 6.81 5.48 2.69 13.44l7.98 6.2C12.13 13.09 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.59C43.99 37.13 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M9.67 28.09c-1.13-3.36-1.13-6.98 0-10.34l-7.98-6.2C-1.13 16.09-1.13 31.91 9.67 39.91l7.98-6.2z"/><path fill="#EA4335" d="M24 46c6.18 0 11.64-2.03 15.84-5.53l-7.19-5.59c-2.01 1.35-4.6 2.12-8.65 2.12-6.38 0-11.87-3.59-14.33-8.79l-7.98 6.2C6.81 42.52 14.82 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium block mb-1" style={{ color: 'var(--muted)' }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border outline-none transition"
              style={{
                background: 'var(--input-bg)',
                color: 'var(--input-fg)',
                border: '1.5px solid var(--border)',
                fontSize: 16
              }}
              autoComplete="email"
            />
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium block mb-1" style={{ color: 'var(--muted)' }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border outline-none transition"
              style={{
                background: 'var(--input-bg)',
                color: 'var(--input-fg)',
                border: '1.5px solid var(--border)',
                fontSize: 16
              }}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
          {error && <div className="text-sm text-red-500 text-center mb-2">{error}</div>}
          {success && <div className="text-sm text-green-500 text-center mb-2">{success}</div>}
          <button
            type="submit"
            className="w-full px-4 py-2 rounded-lg font-semibold transition mb-2"
            style={{
              background: 'var(--button-bg)',
              color: 'var(--button-fg)',
              opacity: loading ? 0.7 : 1
            }}
            disabled={loading}
          >
            {loading ? (mode === 'login' ? 'Signing in...' : 'Signing up...') : (mode === 'login' ? 'Sign In' : 'Sign Up')}
          </button>
          <div className="flex justify-center gap-2 mt-2 text-sm">
            {mode === 'login' ? (
              <>
                <span style={{ color: 'var(--muted)' }}>Don&apos;t have an account?</span>
                <button type="button" className="underline" style={{ color: 'var(--accent)', background: 'transparent' }} onClick={() => setMode('signup')}>Sign Up</button>
              </>
            ) : (
              <>
                <span style={{ color: 'var(--muted)' }}>Already have an account?</span>
                <button type="button" className="underline" style={{ color: 'var(--accent)', background: 'transparent' }} onClick={() => setMode('login')}>Sign In</button>
              </>
            )}
          </div>
        </form>
      </Dialog.Panel>
    </Dialog>
  );
} 