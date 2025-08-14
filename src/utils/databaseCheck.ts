import { supabase } from './supabaseClient';

export async function checkDatabaseSetup() {
  console.log('🔍 Checking database setup...');
  
  // Check if environment variables are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('Environment variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables. Please create .env.local with your Supabase credentials.');
    return false;
  }
  
  try {
    // Test connection by trying to get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      if (authError.message === 'Auth session missing!') {
        console.info('ℹ️  No user session: user is not logged in.');
      } else {
        console.error('❌ Authentication error:', authError.message);
      }
    } else {
      console.log('✅ Authentication working');
      console.log('- Current user:', user ? user.id : 'None');
    }
    
    // Test database connection by trying to query the pages table
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('count')
      .limit(1);
    
    if (pagesError) {
      console.error('❌ Database error:', pagesError.message);
      if (pagesError.message.includes('relation "pages" does not exist')) {
        console.error('❌ The "pages" table does not exist. Please run the SQL from DATABASE_SETUP.md');
        console.error('❌ This is likely why new users are stuck on loading!');
      } else if (pagesError.message.includes('permission denied')) {
        console.error('❌ Permission denied. Check RLS policies and user authentication.');
      }
      return false;
    } else {
      console.log('✅ Database connection working');
      console.log('✅ Pages table exists');
    }
    
    // Test folders table
    const { data: folders, error: foldersError } = await supabase
      .from('folders')
      .select('count')
      .limit(1);
    
    if (foldersError) {
      console.error('❌ Folders table error:', foldersError.message);
      if (foldersError.message.includes('relation "folders" does not exist')) {
        console.error('❌ The "folders" table does not exist. Please run the SQL from DATABASE_SETUP.md');
        console.error('❌ This is likely why new users are stuck on loading!');
      } else if (foldersError.message.includes('permission denied')) {
        console.error('❌ Permission denied. Check RLS policies and user authentication.');
      }
      return false;
    } else {
      console.log('✅ Folders table exists');
    }
    
    console.log('✅ Database setup looks good!');
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
} 