"use client";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../utils/supabaseClient';

export default function AuthPanel() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-8"
      style={{
        background: 'var(--dropdown-bg)',
        color: 'var(--foreground)',
        borderRadius: 24,
        boxShadow: '0 8px 40px 0 rgba(0,0,0,0.18)',
        border: '1.5px solid var(--border)',
        backdropFilter: 'var(--glass-blur)'
      }}
    >
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: 'var(--accent)',
                brandAccent: 'var(--accent)',
                inputBorder: 'var(--border)',
                inputBackground: 'var(--input-bg)',
                inputText: 'var(--input-fg)',
                messageText: 'var(--foreground)',
                anchorTextColor: 'var(--accent)',
                defaultButtonBackground: 'var(--button-bg)',
                defaultButtonText: 'var(--button-fg)',
                dividerBackground: 'var(--border)'
              }
            }
          }
        }}
        providers={[]}
        theme="dark"
      />
    </div>
  );
} 