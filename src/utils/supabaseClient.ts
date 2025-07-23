import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are set
// if (!supabaseUrl || !supabaseAnonKey) {
//   console.error('Missing Supabase environment variables:');
//   console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
//   console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
//   console.error('Please create a .env.local file with your Supabase credentials');
// }

const getURL = () => {
  let url = process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this in your Vercel project
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel
    'http://localhost:3000/';
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  // Make sure to include trailing `/`
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  return url;
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'x-initial-location': getURL()
      }
    }
  }
);