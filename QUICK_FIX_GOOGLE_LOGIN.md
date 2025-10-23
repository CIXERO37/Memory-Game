# ⚡ QUICK FIX - Google Login (Updated dengan Table `profiles`)

## 🎯 MASALAH

Users sudah berhasil login ke Supabase Auth, tapi aplikasi redirect kembali ke login.

## ✅ SOLUSI (Copy & Run Script Ini)

### 1. Buka Supabase → SQL Editor → Run Script Ini:

```sql
-- Create profiles table
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    username VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Service role can do anything"
    ON profiles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view all profiles"
    ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT TO anon USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Migrate existing users from auth.users
INSERT INTO profiles (id, email, full_name, avatar_url, username)
SELECT
    id,
    email,
    COALESCE(
        raw_user_meta_data->>'full_name',
        raw_user_meta_data->>'name',
        SPLIT_PART(email, '@', 1)
    ),
    raw_user_meta_data->>'avatar_url',
    COALESCE(
        raw_user_meta_data->>'full_name',
        raw_user_meta_data->>'name',
        SPLIT_PART(email, '@', 1)
    )
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
```

### 2. Verify Migration:

```sql
-- Check count
SELECT
    (SELECT COUNT(*) FROM auth.users) as users,
    (SELECT COUNT(*) FROM profiles) as profiles;

-- View migrated data
SELECT id, email, full_name, username FROM profiles;
```

### 3. Clear Browser & Test:

```bash
# Clear browser cache (Ctrl + Shift + Delete)
# Restart dev server
npm run dev
# Test login in incognito mode
```

## ✅ DONE!

Login dengan Google harusnya sekarang berhasil masuk ke homepage.

**Files Updated:**

- `scripts/27_fix_existing_users_profile.sql` - Full migration script
- `app/auth/callback/page.tsx` - Updated callback handler
- Table name: `profiles` (bukan `users_profile`)

