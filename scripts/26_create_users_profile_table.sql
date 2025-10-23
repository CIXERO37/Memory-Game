-- Create users_profile table for storing additional user information
-- This table will be automatically populated when users sign up via Google OAuth

-- Drop table if exists (for fresh setup)
DROP TABLE IF EXISTS users_profile CASCADE;

-- Create users_profile table
CREATE TABLE users_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    username VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- 1. Allow users to read their own profile
CREATE POLICY "Users can view own profile"
    ON users_profile
    FOR SELECT
    USING (auth.uid() = id);

-- 2. Allow users to update their own profile
CREATE POLICY "Users can update own profile"
    ON users_profile
    FOR UPDATE
    USING (auth.uid() = id);

-- 3. Allow anyone to read profiles (for displaying user info in game)
CREATE POLICY "Anyone can view profiles"
    ON users_profile
    FOR SELECT
    USING (true);

-- 4. Allow automatic insert when user signs up
CREATE POLICY "Allow insert for authenticated users"
    ON users_profile
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users_profile (id, email, full_name, avatar_url, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            SPLIT_PART(NEW.email, '@', 1)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create index for better performance
CREATE INDEX idx_users_profile_email ON users_profile(email);
CREATE INDEX idx_users_profile_username ON users_profile(username);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_profile_updated_at ON users_profile;

CREATE TRIGGER update_users_profile_updated_at
    BEFORE UPDATE ON users_profile
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Verification query (run this after creating to verify)
-- SELECT * FROM users_profile;


