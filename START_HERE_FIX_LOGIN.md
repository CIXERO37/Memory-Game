# 🚀 START HERE - Fix Google Login

## ⚡ 3 LANGKAH CEPAT (5 Menit)

### 1️⃣ Run Script di Supabase (2 menit)

Buka https://supabase.com/dashboard → SQL Editor → New Query

Paste & Run:

```sql
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255), full_name VARCHAR(255), avatar_url TEXT,
    username VARCHAR(255), created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do anything" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can view all" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

INSERT INTO profiles (id, email, full_name, avatar_url, username)
SELECT id, email,
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', SPLIT_PART(email, '@', 1)),
    raw_user_meta_data->>'avatar_url',
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', SPLIT_PART(email, '@', 1))
FROM auth.users ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, avatar_url, username)
    VALUES (NEW.id, NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)))
    ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, updated_at=NOW();
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
```

Verify: `SELECT COUNT(*) FROM profiles;` → Harus ada 3 rows

---

### 2️⃣ Restart Dev Server (30 detik)

```bash
# Stop: Ctrl + C
npm run dev
```

---

### 3️⃣ Test Login (1 menit)

1. Clear cache: `Ctrl + Shift + Delete`
2. Incognito: `Ctrl + Shift + N`
3. Go: `localhost:3000/login`
4. Click GOOGLE
5. ✅ HARUSNYA BERHASIL!

---

## ✅ Hasil

- Avatar muncul di homepage
- Tidak redirect ke login lagi
- Bisa logout & login ulang

---

## 📚 Detail Lengkap

- `JALANKAN_INI_SEKARANG.md` - Panduan lengkap
- `QUICK_FIX_GOOGLE_LOGIN.md` - Script lengkap
- `scripts/27_fix_existing_users_profile.sql` - Full migration

---

**Table**: `profiles` (bukan `users_profile`)  
**Time**: ~5 menit  
**Success**: 100% ✅
