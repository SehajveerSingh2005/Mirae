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
          className="absolute top-3 right-3 p-3 text-xl cursor-pointer z-10 rounded-full transition min-w-[40px] min-h-[40px] flex items-center justify-center"
          style={{ color: 'var(--muted)', background: 'transparent' }}
          onClick={onClose}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--button-hover-bg)')}
          onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Close"
        >
          &times;
        </button>
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-2 text-center" style={{ color: 'var(--foreground)' }}>
            {mode === 'login' ? 'Sign In' : 'Sign Up'}
          </h2>
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