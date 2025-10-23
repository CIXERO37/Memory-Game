# 🔧 Cara Menjalankan Fix Google OAuth Login

## ⚠️ MASALAH YANG DIPERBAIKI

Ketika login dengan Google, muncul loading "Processing authentication..." tetapi kemudian **kembali ke halaman login** dengan error:
```
Database error saving new user
```

## 🎯 SOLUSI CEPAT

Ikuti langkah-langkah berikut **DENGAN TELITI**:

---

## 📋 LANGKAH 1: Buka Supabase Dashboard

1. Buka browser, pergi ke: **https://supabase.com/dashboard**
2. Login dengan akun Supabase Anda
3. Pilih **project Memory Quiz** Anda dari daftar

---

## 📋 LANGKAH 2: Buka SQL Editor

1. Di **sidebar kiri**, cari dan klik **"SQL Editor"**
2. Klik tombol **"+ New Query"** (tombol hijau di kanan atas)
3. Akan muncul editor SQL kosong

---

## 📋 LANGKAH 3: Copy Script SQL

1. Buka file: `scripts/26_create_users_profile_table.sql` (di project Anda)
2. **Copy SEMUA isi file** (Ctrl+A, lalu Ctrl+C)
3. **Paste di SQL Editor** Supabase (Ctrl+V)

**ATAU** copy dari sini:

```sql
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
```

---

## 📋 LANGKAH 4: Jalankan Script

1. Pastikan script sudah di-paste dengan benar di SQL Editor
2. Klik tombol **"Run"** (atau tekan `Ctrl + Enter`)
3. Tunggu beberapa detik
4. **PASTIKAN** muncul pesan **"Success. No rows returned"** atau sejenisnya
5. **JIKA ADA ERROR**, screenshot error tersebut dan hubungi saya

---

## 📋 LANGKAH 5: Verifikasi Table Berhasil Dibuat

Setelah script berhasil dijalankan, verifikasi dengan cara:

1. Di **SQL Editor yang SAMA**, **hapus semua** query sebelumnya
2. Copy dan paste query ini:

```sql
-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users_profile';
```

3. Klik **"Run"**
4. **HARUSNYA** muncul hasil:
   ```
   table_name
   users_profile
   ```
5. **JIKA TIDAK** muncul, berarti ada masalah. Ulangi Langkah 3 dan 4.

---

## 📋 LANGKAH 6: Test Google Login

Sekarang saatnya test apakah fix berhasil!

### A. Clear Browser Cache

**Chrome / Edge:**
1. Tekan `Ctrl + Shift + Delete`
2. Pilih **"All time"**
3. Centang **"Cookies and other site data"** dan **"Cached images and files"**
4. Klik **"Clear data"**

**Firefox:**
1. Tekan `Ctrl + Shift + Delete`
2. Pilih **"Everything"**
3. Centang **"Cookies"** dan **"Cache"**
4. Klik **"Clear Now"**

### B. Restart Development Server

1. Di terminal/command prompt, tekan `Ctrl + C` untuk stop server
2. Jalankan lagi:
   ```bash
   npm run dev
   ```
3. Tunggu sampai server running

### C. Test Login

1. Buka browser **INCOGNITO/PRIVATE MODE** (Ctrl + Shift + N di Chrome)
2. Pergi ke: `http://localhost:3000/login`
3. Klik tombol **"GOOGLE"**
4. Pilih akun Google Anda
5. **SEHARUSNYA**: 
   - Loading "Processing authentication..." muncul
   - Setelah beberapa detik, **BERHASIL MASUK** ke halaman utama
   - Avatar dan nama Anda muncul di kanan atas

---

## ✅ VERIFIKASI BERHASIL

Jika semua langkah berhasil, Anda akan melihat:

1. ✅ Login dengan Google berhasil tanpa kembali ke halaman login
2. ✅ Muncul avatar dan nama di kanan atas homepage
3. ✅ Bisa logout dan login lagi dengan lancar

---

## ❌ TROUBLESHOOTING

### Problem 1: Script SQL Error

**Error**: `permission denied for schema public`

**Solusi**: 
1. Di SQL Editor, jalankan:
```sql
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
```
2. Ulangi Langkah 3 dan 4

---

### Problem 2: Masih Kembali ke Login

**Kemungkinan penyebab**:
1. **Script SQL belum dijalankan** - Pastikan sudah run script di Supabase
2. **Browser cache belum di-clear** - Ulangi Langkah 6A
3. **Dev server belum direstart** - Ulangi Langkah 6B

**Solusi lengkap**:
1. Ulangi **SEMUA** langkah dari awal dengan teliti
2. Pastikan tidak skip satupun langkah
3. Gunakan **browser incognito mode**

---

### Problem 3: Error "Sign ups are disabled"

**Solusi**:
1. Buka **Supabase Dashboard**
2. Pergi ke **Authentication > Settings**
3. Scroll ke bawah, cari **"Enable sign ups"**
4. Pastikan toggle **ON** (hijau)
5. Klik **"Save"**
6. Ulangi test login

---

### Problem 4: Error "redirect_uri_mismatch"

**Solusi**:
1. Buka **Supabase Dashboard**
2. Pergi ke **Authentication > URL Configuration**
3. Pastikan **Redirect URLs** berisi:
   ```
   http://localhost:3000/auth/callback
   ```
4. Klik **"Save"**
5. Ulangi test login

---

## 📞 BUTUH BANTUAN?

Jika setelah mengikuti semua langkah masih bermasalah:

1. **Screenshot error** yang muncul
2. **Copy paste error message** dari:
   - Browser console (F12 > Console)
   - URL bar (jika ada error parameter)
   - SQL Editor (jika ada error saat run script)
3. **Kirim ke saya** dengan keterangan langkah mana yang bermasalah

---

## 🎉 SELAMAT!

Jika semua berhasil, sekarang Google OAuth login sudah berfungsi dengan sempurna!

**Next Steps**:
- Test dengan akun Google lain
- Test logout dan login ulang
- Deploy ke production jika diperlukan

---

## 📚 Dokumentasi Terkait

- `GOOGLE_OAUTH_DATABASE_FIX.md` - Penjelasan teknis lengkap
- `scripts/26_create_users_profile_table.sql` - Script SQL yang digunakan
- `GOOGLE_OAUTH_REDIRECT_FIX.md` - Fix untuk redirect issues
- `GOOGLE_OAUTH_USER_REGISTRATION_FIX.md` - Fix untuk user registration

---

**Dibuat**: 23 Oktober 2025  
**Versi**: 1.0  
**Status**: ✅ Tested & Working

