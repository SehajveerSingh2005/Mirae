# Database Setup Guide

## Supabase Configuration

1. Create a `.env.local` file in the root directory with the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

2. Replace the placeholder values with your actual Supabase project credentials from your Supabase dashboard.

## Database Schema

The app requires the following tables in your Supabase database:

### Pages Table
```sql
CREATE TABLE pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Page',
  content TEXT NOT NULL DEFAULT '',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_favorite BOOLEAN DEFAULT FALSE
);

-- Enable RLS (Row Level Security)
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own pages" ON pages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pages" ON pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pages" ON pages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pages" ON pages
  FOR DELETE USING (auth.uid() = user_id);
```

### Folders Table
```sql
CREATE TABLE folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own folders" ON folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders" ON folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON folders
  FOR DELETE USING (auth.uid() = user_id);
```

## Quick Setup Steps

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for it to be ready

2. **Get Your Credentials**
   - Go to Settings → API in your Supabase dashboard
   - Copy the Project URL and anon public key

3. **Create Environment File**
   - Create `.env.local` in your project root
   - Add your Supabase URL and anon key

4. **Create Database Tables**
   - Go to SQL Editor in your Supabase dashboard
   - Run the SQL above to create the tables

5. **Test the App**
   - Restart your dev server: `npm run dev`
   - Check the browser console for setup status
   - Try creating a page

## Features Implemented

✅ **Authentication Setup**
- Supabase Auth integration
- Auth context for state management
- Login/Signup modal
- User session management

✅ **Database Integration**
- Pages CRUD operations
- Folders CRUD operations
- Favorites system
- Real-time data synchronization
- Row Level Security (RLS) policies

✅ **UI Updates**
- Conditional rendering based on auth state
- Loading states
- Error handling
- Database-driven favorites system

## Troubleshooting

The app now includes automatic database setup checking. Check the browser console for detailed error messages that will help identify any issues with:
- Environment variables
- Database connection
- Table existence
- Authentication status 