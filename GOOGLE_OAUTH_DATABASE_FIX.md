# Perbaikan Error Database Google OAuth - "Database error saving new user"

## Masalah yang Ditemukan

Dari URL error yang terlihat di gambar:
```
localhost:3000/auth/callback?error=server_error&error_code=unexpected_failure&error_description=Database+error+saving+new+user
```

**Root Cause**: Supabase mencoba menyimpan user baru ke database setelah Google OAuth berhasil, tetapi gagal karena:
1. Tidak ada table `users_profile` atau table profile lainnya
2. Row Level Security (RLS) policies yang memblokir insert
3. Tidak ada trigger untuk auto-populate user profile

## Solusi Lengkap

### Step 1: Jalankan Script SQL di Supabase Dashboard

1. **Buka Supabase Dashboard**
   - Login ke [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Pilih project Anda

2. **Pergi ke SQL Editor**
   - Di sidebar kiri, klik **SQL Editor**
   - Klik **New Query**

3. **Copy dan Paste Script**
   - Buka file `scripts/26_create_users_profile_table.sql`
   - Copy semua isi file
   - Paste di SQL Editor

4. **Execute Script**
   - Klik tombol **Run** atau tekan `Ctrl+Enter`
   - Tunggu sampai eksekusi selesai
   - Pastikan tidak ada error

### Step 2: Verifikasi Table Berhasil Dibuat

Jalankan query ini di SQL Editor:

```sql
-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users_profile';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'users_profile';

-- Check trigger
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'users';
```

### Step 3: Test Google OAuth Login

1. **Clear browser cache dan cookies**
2. **Restart development server**
   ```bash
   npm run dev
   ```

3. **Test Login Flow**
   - Buka `http://localhost:3000/login`
   - Klik tombol **GOOGLE**
   - Pilih akun Google
   - **Harusnya sekarang berhasil masuk**

### Step 4: Verifikasi User Profile Tersimpan

Setelah login berhasil, jalankan query ini di SQL Editor:

```sql
-- Check if user profile is created
SELECT * FROM users_profile ORDER BY created_at DESC LIMIT 5;

-- Check auth users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;
```

## Penjelasan Teknis

### 1. **Table `users_profile`**

Table ini menyimpan informasi tambahan user yang didapat dari Google OAuth:
- `id`: UUID yang sama dengan `auth.users.id`
- `email`: Email user dari Google
- `full_name`: Nama lengkap dari Google profile
- `avatar_url`: URL foto profil dari Google
- `username`: Nama user (dari full_name atau email)

### 2. **Row Level Security (RLS) Policies**

Policies yang dibuat:
- ✅ Users dapat melihat profile mereka sendiri
- ✅ Users dapat update profile mereka sendiri
- ✅ Semua orang dapat melihat profile (untuk game multiplayer)
- ✅ Authenticated users dapat insert profile

### 3. **Trigger `on_auth_user_created`**

Trigger ini otomatis:
- Berjalan setiap kali ada user baru di table `auth.users`
- Membuat record di `users_profile` dengan data dari Google OAuth
- Mengambil data dari `raw_user_meta_data` yang disimpan Supabase

### 4. **Function `handle_new_user()`**

Function ini:
- Dijalankan oleh trigger
- Extract data dari Google OAuth metadata
- Insert ke table `users_profile`
- Handle fallback jika data tidak lengkap

## Troubleshooting

### Error: "permission denied for schema public"

**Solusi**: Pastikan permissions sudah di-grant dengan benar. Jalankan:

```sql
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
```

### Error: "trigger already exists"

**Solusi**: Drop trigger dulu, lalu create lagi:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Then run the CREATE TRIGGER command again
```

### Error: "function already exists"

**Solusi**: Gunakan `CREATE OR REPLACE FUNCTION` (sudah ada di script)

### User login berhasil tapi profile tidak tersimpan

**Solusi**: 
1. Check apakah trigger active:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. Check function logs:
   ```sql
   SELECT * FROM pg_stat_user_functions WHERE funcname = 'handle_new_user';
   ```

3. Manual insert untuk testing:
   ```sql
   INSERT INTO users_profile (id, email, username)
   SELECT id, email, SPLIT_PART(email, '@', 1)
   FROM auth.users
   WHERE id NOT IN (SELECT id FROM users_profile);
   ```

## Testing Checklist

- [ ] Script SQL berhasil dijalankan tanpa error
- [ ] Table `users_profile` berhasil dibuat
- [ ] RLS policies berhasil dibuat
- [ ] Trigger berhasil dibuat
- [ ] Google login berhasil tanpa error
- [ ] User profile tersimpan di database
- [ ] User berhasil redirect ke homepage
- [ ] User data muncul di UI (avatar, name, email)

## Konfigurasi Tambahan (Optional)

### A. Enable Supabase Realtime untuk User Profile

Jika ingin real-time updates untuk user profile:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE users_profile;
```

### B. Add Constraints untuk Data Integrity

```sql
-- Ensure email is unique
ALTER TABLE users_profile ADD CONSTRAINT users_profile_email_unique UNIQUE (email);

-- Ensure username is unique
ALTER TABLE users_profile ADD CONSTRAINT users_profile_username_unique UNIQUE (username);
```

### C. Add Additional Columns (Optional)

Jika ingin menambah kolom lain:

```sql
ALTER TABLE users_profile ADD COLUMN bio TEXT;
ALTER TABLE users_profile ADD COLUMN phone VARCHAR(20);
ALTER TABLE users_profile ADD COLUMN country VARCHAR(100);
ALTER TABLE users_profile ADD COLUMN language VARCHAR(10) DEFAULT 'en';
```

## Verifikasi Akhir

Setelah semua langkah selesai, test dengan:

1. **Clear all browser data**
2. **Use incognito/private mode**
3. **Login dengan Google account yang BELUM PERNAH login**
4. **Verify:**
   - Login berhasil
   - Redirect ke homepage
   - User data muncul di UI
   - Profile tersimpan di database

## Next Steps

Setelah fix ini berhasil:

1. ✅ Test login dengan multiple Google accounts
2. ✅ Test logout functionality
3. ✅ Deploy ke production (Vercel/Coolify)
4. ✅ Update Google OAuth redirect URIs di production
5. ✅ Test production login flow

## Files yang Terlibat

- `scripts/26_create_users_profile_table.sql` - Script SQL untuk create table dan trigger
- `lib/supabase.ts` - Supabase client configuration
- `hooks/use-auth.ts` - Auth hook yang menggunakan user profile
- `app/auth/callback/page.tsx` - OAuth callback handler
- `app/login/page.tsx` - Login page dengan Google OAuth button

## Summary

Perbaikan ini mengatasi error "Database error saving new user" dengan:
- ✅ Membuat table `users_profile` untuk menyimpan data user
- ✅ Mengatur RLS policies yang benar
- ✅ Membuat trigger untuk auto-populate profile saat signup
- ✅ Mengatur permissions yang tepat

Setelah script SQL dijalankan, Google OAuth akan berfungsi dengan sempurna dan user baru bisa login tanpa error!


