# Panduan Mengatasi Masalah Google OAuth - Pengguna Baru Tidak Bisa Masuk

## Masalah

Pengguna dengan akun Google yang tidak terkait dengan akun yang sudah ada di Supabase tidak bisa masuk ke aplikasi.

## Solusi Lengkap

### 1. **Periksa Konfigurasi Supabase Dashboard**

#### A. Authentication Settings

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Pergi ke **Authentication** > **Settings**
4. Pastikan pengaturan berikut:
   - ✅ **Enable email confirmations**: OFF (untuk memudahkan testing)
   - ✅ **Enable phone confirmations**: OFF
   - ✅ **Enable sign ups**: ON ⭐ **INI YANG PENTING!**
   - ✅ **Enable email change**: ON
   - ✅ **Enable phone change**: ON

#### B. Google Provider Settings

1. Pergi ke **Authentication** > **Providers**
2. Scroll ke bagian **Google**
3. Pastikan:
   - ✅ **Enable sign in with Google**: ON
   - ✅ **Client ID**: Sudah diisi dengan benar dari Google Cloud Console
   - ✅ **Client Secret**: Sudah diisi dengan benar dari Google Cloud Console

#### C. URL Configuration

1. Di **Authentication** > **URL Configuration**
2. Pastikan **Site URL** sudah diatur dengan benar:
   - Untuk development: `http://localhost:3000`
   - Untuk production: `https://your-domain.com`
3. Pastikan **Redirect URLs** berisi:
   - `http://localhost:3000/auth/callback` (untuk development)
   - `https://your-domain.com/auth/callback` (untuk production)

### 2. **Periksa Google Cloud Console**

1. Buka [Google Cloud Console](https://console.developers.google.com/)
2. Pilih project Anda
3. Pergi ke **APIs & Services** > **Credentials**
4. Edit OAuth 2.0 Client ID Anda
5. Pastikan **Authorized redirect URIs** berisi:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback (untuk development)
   https://your-domain.com/auth/callback (untuk production)
   ```

### 3. **Testing dengan Debugging**

Kode sudah diperbarui dengan logging yang lebih detail. Untuk testing:

1. Buka Developer Tools (F12)
2. Pergi ke tab **Console**
3. Klik tombol **GOOGLE** di halaman login
4. Perhatikan log yang muncul:
   - `=== Google OAuth Debug Info ===`
   - `=== Auth Callback Debug ===`

### 4. **Troubleshooting Umum**

#### Error: "Invalid redirect URI"

- Pastikan redirect URI di Google Cloud Console sama persis dengan yang ada di Supabase
- Pastikan tidak ada trailing slash yang tidak perlu

#### Error: "Client ID not found"

- Pastikan Client ID di Supabase Dashboard sama dengan yang ada di Google Cloud Console
- Pastikan Google Cloud Console project sudah aktif

#### Error: "Sign ups are disabled"

- Pastikan **Enable sign ups** di Supabase Dashboard sudah ON
- Ini adalah penyebab paling umum mengapa pengguna baru tidak bisa masuk

#### Error: "Email already exists"

- Ini normal jika email sudah terdaftar dengan provider lain
- Supabase akan otomatis link akun jika email sama

### 5. **Verifikasi Konfigurasi**

Untuk memastikan konfigurasi sudah benar, periksa:

1. **Supabase Dashboard**:

   - Authentication > Settings > Enable sign ups: ON
   - Authentication > Providers > Google: Enabled
   - Authentication > URL Configuration > Site URL: Correct

2. **Google Cloud Console**:

   - APIs & Services > Credentials > OAuth 2.0 Client ID: Active
   - Authorized redirect URIs: Contains Supabase callback URL

3. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`: Set correctly
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Set correctly
   - `NEXT_PUBLIC_SITE_URL`: Set correctly (for production)

### 6. **Testing Langkah demi Langkah**

1. **Clear browser cache** dan cookies
2. **Restart development server** (`npm run dev`)
3. **Buka aplikasi** di browser baru/incognito
4. **Klik tombol GOOGLE** di halaman login
5. **Periksa console** untuk error messages
6. **Selesaikan OAuth flow** di Google
7. **Periksa apakah redirect** ke aplikasi berhasil

### 7. **Jika Masih Bermasalah**

Jika setelah mengikuti langkah-langkah di atas masih bermasalah:

1. **Periksa Supabase Logs**:

   - Supabase Dashboard > Logs > Auth
   - Lihat error messages yang muncul

2. **Periksa Google Cloud Console Logs**:

   - Google Cloud Console > APIs & Services > Credentials
   - Lihat apakah ada error di OAuth consent screen

3. **Test dengan akun Google yang berbeda**:
   - Coba dengan akun Google yang belum pernah login ke aplikasi
   - Pastikan akun Google memiliki email yang valid

## Catatan Penting

- **Enable sign ups** di Supabase adalah pengaturan yang paling penting
- Pastikan semua URL (redirect URIs) sama persis di semua tempat
- Clear cache browser setelah mengubah konfigurasi
- Test dengan browser incognito untuk menghindari cache issues

## File yang Diperbarui

- `app/login/page.tsx`: Ditambahkan debugging yang lebih detail
- `app/auth/callback/page.tsx`: Ditambahkan logging untuk troubleshooting
- `GOOGLE_OAUTH_USER_REGISTRATION_FIX.md`: Panduan lengkap ini
