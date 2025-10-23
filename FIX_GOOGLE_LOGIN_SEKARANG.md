# 🚀 FIX GOOGLE LOGIN - LANGKAH CEPAT

## ❗ MASALAH
Login Google loading terus, lalu **KEMBALI KE HALAMAN LOGIN** lagi.

Error: `Database error saving new user`

---

## ✅ SOLUSI (5 Menit)

### 1️⃣ Buka Supabase Dashboard
- Pergi ke: https://supabase.com/dashboard
- Login dan pilih project Anda
- Klik **SQL Editor** di sidebar kiri
- Klik **+ New Query**

### 2️⃣ Copy & Paste Script Ini

```sql
-- Create users_profile table
DROP TABLE IF EXISTS users_profile CASCADE;

CREATE TABLE users_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    username VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON users_profile FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users_profile FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view profiles"
    ON users_profile FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users"
    ON users_profile FOR INSERT WITH CHECK (auth.uid() = id);

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE INDEX idx_users_profile_email ON users_profile(email);
CREATE INDEX idx_users_profile_username ON users_profile(username);

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
```

### 3️⃣ Jalankan Script
- Klik tombol **RUN** atau tekan `Ctrl + Enter`
- Tunggu sampai selesai (harusnya muncul "Success")

### 4️⃣ Verifikasi
Jalankan query ini untuk cek:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'users_profile';
```
Harusnya muncul hasil: `users_profile`

### 5️⃣ Test Login
1. **Clear browser cache**: `Ctrl + Shift + Delete` > Clear data
2. **Restart dev server**: 
   - Stop server: `Ctrl + C`
   - Start lagi: `npm run dev`
3. **Buka browser incognito**: `Ctrl + Shift + N`
4. **Pergi ke**: `http://localhost:3000/login`
5. **Klik tombol GOOGLE**
6. **Pilih akun Google**
7. **✅ HARUSNYA BERHASIL MASUK!**

---

## 🎯 CHECKLIST

- [ ] Script SQL dijalankan di Supabase
- [ ] Table `users_profile` berhasil dibuat
- [ ] Browser cache di-clear
- [ ] Dev server direstart
- [ ] Test login berhasil
- [ ] Avatar muncul di homepage

---

## ⚠️ MASIH ERROR?

### Cek Pengaturan Supabase:
1. **Authentication > Settings**
   - ✅ Enable sign ups: **ON**
2. **Authentication > Providers > Google**
   - ✅ Enable sign in with Google: **ON**
3. **Authentication > URL Configuration**
   - ✅ Redirect URLs: `http://localhost:3000/auth/callback`

---

## 📚 Detail Lengkap

Lihat file ini untuk penjelasan detail:
- `CARA_MENJALANKAN_FIX_GOOGLE_OAUTH.md` - Panduan lengkap
- `GOOGLE_OAUTH_DATABASE_FIX.md` - Penjelasan teknis
- `scripts/26_create_users_profile_table.sql` - Script SQL lengkap

---

**✨ SETELAH FIX INI, GOOGLE LOGIN AKAN BERFUNGSI 100%!**


