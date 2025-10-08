# Supabase Configuration Guide

## Problem: "Failed to fetch quizzes, please check your Supabase configuration"

This error occurs when the Supabase environment variables are not properly configured.

## Solution Steps:

### 1. Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** > **API**
4. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **anon/public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 2. Configure Environment Variables

#### For Local Development:

1. Create `.env.local` file in your project root
2. Add the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Restart your development server (`npm run dev`)

#### For Production Deployment (Colify/Vercel/Netlify):

1. Go to your deployment platform's dashboard
2. Navigate to **Environment Variables** or **Settings**
3. Add these variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
4. Redeploy your application

### 3. Verify Database Setup

Make sure your Supabase database has the `quizzes` table with proper data. You can run the SQL scripts in the `scripts/` folder to set up the database.

### 4. Check Row Level Security (RLS)

Ensure that RLS policies allow anonymous access to the `quizzes` table:

```sql
-- Allow anonymous read access to quizzes
CREATE POLICY "Allow anonymous read access to quizzes" ON quizzes
FOR SELECT USING (true);
```

## Troubleshooting:

- **Still getting errors?** Check the browser console for detailed error messages
- **Database connection issues?** Verify your Supabase project is active and not paused
- **Permission denied?** Check RLS policies in Supabase dashboard
- **Environment variables not working?** Make sure they start with `NEXT_PUBLIC_` for client-side access

## Files to Check:

- `.env.local` (should exist and contain your credentials)
- `lib/supabase.ts` (contains the Supabase client configuration)
- `env.example.txt` (template for environment variables)
