# Panduan Konfigurasi URL Redirect untuk Multi-Environment

## URL yang Perlu Dikonfigurasi

Untuk mendukung login di ketiga environment, Anda perlu menambahkan URL berikut:

1. **Development**: `http://localhost:3000`
2. **Vercel**: `https://memorygame-quiz.vercel.app`
3. **Coolify**: `https://memoryquiz.gameforsmart.com`

## 1. Konfigurasi Supabase Dashboard

### Langkah-langkah:

1. **Buka Supabase Dashboard**

   - Login ke [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Pilih project Anda

2. **Navigasi ke Authentication Settings**

   - Klik "Authentication" di sidebar kiri
   - Klik "URL Configuration" atau "Settings"

3. **Konfigurasi Site URL**

   - **Site URL**: `https://memorygame-quiz.vercel.app` (atau domain utama Anda)
   - Klik "Save changes"

4. **Konfigurasi Redirect URLs**
   - Di bagian "Redirect URLs", tambahkan URL berikut:
     ```
     http://localhost:3000/
     http://localhost:3000/auth/callback
     https://memorygame-quiz.vercel.app/
     https://memorygame-quiz.vercel.app/auth/callback
     https://memoryquiz.gameforsmart.com/
     https://memoryquiz.gameforsmart.com/auth/callback
     ```
   - Klik "Add URL" untuk setiap URL
   - Klik "Save changes"

## 2. Konfigurasi Google Cloud Console

### Langkah-langkah:

1. **Buka Google Cloud Console**

   - Login ke [https://console.developers.google.com/](https://console.developers.google.com/)
   - Pilih project Anda

2. **Navigasi ke OAuth 2.0 Client IDs**

   - Klik "APIs & Services" > "Credentials"
   - Cari OAuth 2.0 Client ID yang sudah ada
   - Klik ikon edit (pensil)

3. **Konfigurasi Authorized redirect URIs**
   - Di bagian "Authorized redirect URIs", tambahkan URL berikut:
     ```
     https://diciotrbxyvpzednuvzu.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback
     https://memorygame-quiz.vercel.app/auth/callback
     https://memoryquiz.gameforsmart.com/auth/callback
     ```
   - Klik "Add URI" untuk setiap URL baru
   - Klik "Save"

## 3. Konfigurasi Environment Variables

### Untuk Development (.env.local):

```env
NEXT_PUBLIC_SUPABASE_URL=https://diciotrbxyvpzednuvzu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Untuk Vercel Deployment:

Di Vercel Dashboard > Project Settings > Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://diciotrbxyvpzednuvzu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SITE_URL=https://memorygame-quiz.vercel.app
```

### Untuk Coolify Deployment:

Di Coolify Dashboard > Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://diciotrbxyvpzednuvzu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SITE_URL=https://memoryquiz.gameforsmart.com
```

## 4. Verifikasi Konfigurasi

### Checklist Verifikasi:

**Supabase Dashboard:**

- [ ] Site URL sudah diset ke domain utama
- [ ] Redirect URLs berisi semua 6 URL (3 domain × 2 path)
- [ ] Google provider sudah diaktifkan
- [ ] Google Client ID dan Secret sudah dikonfigurasi

**Google Cloud Console:**

- [ ] Authorized redirect URIs berisi semua 4 URL callback
- [ ] Client ID dan Secret sudah dikonfigurasi di Supabase

**Environment Variables:**

- [ ] NEXT_PUBLIC_SITE_URL sesuai dengan domain deployment
- [ ] NEXT_PUBLIC_SUPABASE_URL sudah benar
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY sudah benar

## 5. Testing

### Test di setiap environment:

1. **Development (localhost:3000)**

   ```bash
   npm run dev
   ```

   - Buka http://localhost:3000
   - Test login dengan Google

2. **Vercel (memorygame-quiz.vercel.app)**

   - Deploy ke Vercel
   - Test login dengan Google

3. **Coolify (memoryquiz.gameforsmart.com)**
   - Deploy ke Coolify
   - Test login dengan Google

## 6. Troubleshooting

### Error Umum:

1. **"redirect_uri_mismatch"**

   - Pastikan URL di Google Cloud Console sama persis dengan yang digunakan
   - Pastikan tidak ada trailing slash yang tidak perlu

2. **"invalid_client"**

   - Pastikan Google Client ID dan Secret sudah benar di Supabase
   - Pastikan Google provider sudah diaktifkan

3. **"redirect_uri_not_allowed"**
   - Pastikan semua URL sudah ditambahkan di Supabase Redirect URLs
   - Pastikan URL sudah ditambahkan di Google Authorized redirect URIs

### Catatan Penting:

- **Waktu Propagasi**: Perubahan di Google Cloud Console bisa memakan waktu 5 menit hingga beberapa jam
- **HTTPS Required**: Semua URL production harus menggunakan HTTPS
- **Exact Match**: URL harus sama persis, termasuk protokol (http/https) dan trailing slash
- **Environment Variables**: Pastikan NEXT_PUBLIC_SITE_URL sesuai dengan domain deployment

## 7. URL Summary

### Supabase Redirect URLs:

```
http://localhost:3000/
http://localhost:3000/auth/callback
https://memorygame-quiz.vercel.app/
https://memorygame-quiz.vercel.app/auth/callback
https://memoryquiz.gameforsmart.com/
https://memoryquiz.gameforsmart.com/auth/callback
```

### Google Authorized redirect URIs:

```
https://diciotrbxyvpzednuvzu.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback
https://memorygame-quiz.vercel.app/auth/callback
https://memoryquiz.gameforsmart.com/auth/callback
```

Setelah mengikuti panduan ini, aplikasi Anda akan bisa login melalui ketiga environment tersebut.
