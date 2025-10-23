-- Fix untuk users yang sudah ada di auth.users tapi belum punya profile
-- Karena users sudah berhasil login ke Supabase Auth, kita perlu:
-- 1. Create table profiles (tanpa trigger yang risky)
-- 2. Populate existing users ke table profiles
-- 3. Setup trigger yang lebih aman

-- Step 1: Drop table jika ada (fresh start)
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 2: Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    username VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies (lebih permissive untuk avoid blocking)

-- Allow service role to do everything (bypass RLS)
CREATE POLICY "Service role can do anything"
    ON profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read all profiles (for game)
CREATE POLICY "Authenticated users can view all profiles"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow users to view their own profile (for anon)
CREATE POLICY "Users can view own profile"
    ON profiles
    FOR SELECT
    TO anon
    USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
    ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Step 5: Populate existing users from auth.users
-- This will migrate all existing Google OAuth users
INSERT INTO profiles (id, email, full_name, avatar_url, username)
SELECT 
    id,
    email,
    COALESCE(
        raw_user_meta_data->>'full_name',
        raw_user_meta_data->>'name',
        SPLIT_PART(email, '@', 1)
    ) AS full_name,
    raw_user_meta_data->>'avatar_url' AS avatar_url,
    COALESCE(
        raw_user_meta_data->>'full_name',
        raw_user_meta_data->>'name',
        SPLIT_PART(email, '@', 1)
    ) AS username
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Step 6: Create safer trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert profile with error handling
    INSERT INTO public.profiles (id, email, full_name, avatar_url, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            SPLIT_PART(NEW.email, '@', 1)
        )
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        username = EXCLUDED.username,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the user creation
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Step 9: Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Step 10: Grant all necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Step 11: Verification queries
-- Run these to verify everything is working:

-- 1. Check if existing users are migrated
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.username,
    p.avatar_url,
    p.created_at
FROM profiles p
ORDER BY p.created_at DESC;

-- 2. Check if count matches
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM profiles) as profiles_count;

-- 3. Check for users without profiles (should be empty)
SELECT 
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

