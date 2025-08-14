"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signOutAndClear: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting initial session:', error);
        } else {
          console.log('✅ Initial session retrieved:', session ? 'User logged in' : 'No user');
          if (session?.user) {
            console.log('👤 User details:', { id: session.user.id, email: session.user.email });
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        console.log('🔄 AuthContext loading state set to false');
      } catch (err) {
        console.error('❌ Unexpected error getting initial session:', err);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change event:', event);
        console.log('🔄 Session present:', !!session);
        if (session?.user) {
          console.log('👤 User in auth change:', { id: session.user.id, email: session.user.email });
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        console.log('🔄 AuthContext loading state set to false after auth change');
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const getRedirectUrl = () => {
    // This ensures we're always using the current origin (localhost in dev, vercel in prod)
    const redirectUrl = `${window.location.origin}/auth/callback`;
    console.log('🔗 Generated redirect URL:', redirectUrl);
    console.log('🔗 Current origin:', window.location.origin);
    return redirectUrl;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      // For email/password login, we don't need to specify redirectTo
      // as it will use the current origin automatically
    });
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getRedirectUrl(),
        // This ensures verification emails go to the correct URL
      }
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const redirectUrl = getRedirectUrl();
    console.log('🔐 Starting Google OAuth with redirect URL:', redirectUrl);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        // This ensures OAuth redirects go to the correct URL
        queryParams: {
          // You can add additional OAuth scopes here if needed
          // access_type: 'offline', // for refresh token
          // prompt: 'consent',      // force consent screen
        }
      }
    });
    
    if (error) {
      console.error('❌ Error signing in with Google:', error.message);
    } else {
      console.log('✅ Google OAuth initiated successfully');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signOutAndClear = async () => {
    await supabase.auth.signOut();
    // Clear any local state if needed
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    signOutAndClear,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 