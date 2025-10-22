# 🚀 Panduan Deploy ke Vercel dengan Google OAuth

## ✅ Masalah yang Sudah Diperbaiki

### **Redirect URL Issue**

- ✅ Fixed: Google OAuth sekarang menggunakan URL yang benar untuk production
- ✅ Added: Environment variable `NEXT_PUBLIC_SITE_URL` untuk production URL
- ✅ Fixed: Automatic detection antara development dan production environment

## 🔧 Setup Environment Variables di Vercel

### **1. Environment Variables yang Diperlukan**

Di Vercel Dashboard, tambahkan environment variables berikut:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Site URL untuk Production (WAJIB untuk Google OAuth)
NEXT_PUBLIC_SITE_URL=https://your-app-name.vercel.app
```

### **2. Cara Menambahkan di Vercel**

1. **Buka Vercel Dashboard**

   - Kunjungi: https://vercel.com/dashboard
   - Pilih project Anda

2. **Masuk ke Settings**

   - Klik tab "Settings" di project Anda
   - Scroll ke bagian "Environment Variables"

3. **Tambahkan Variables**
   - Klik "Add New"
   - Masukkan nama dan value untuk setiap variable
   - Pastikan semua variable ditandai untuk "Production", "Preview", dan "Development"

### **3. Variable yang WAJIB Ditambahkan**

| Variable Name                   | Value                                     | Description                  |
| ------------------------------- | ----------------------------------------- | ---------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://your-project-id.supabase.co`     | URL Supabase project Anda    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase anonymous key       |
| `NEXT_PUBLIC_SITE_URL`          | `https://your-app-name.vercel.app`        | URL production aplikasi Anda |

## 🔑 Setup Google OAuth untuk Production

### **1. Google Cloud Console**

1. **Buka Google Cloud Console**

   - Kunjungi: https://console.developers.google.com/
   - Pilih project yang sama dengan development

2. **Update Authorized Redirect URIs**

   - Pergi ke "APIs & Services" > "Credentials"
   - Klik pada OAuth 2.0 Client ID Anda
   - Di bagian "Authorized redirect URIs", tambahkan:
     ```
     https://your-app-name.vercel.app/auth/callback
     https://your-project-id.supabase.co/auth/v1/callback
     ```

3. **Save Changes**
   - Klik "Save" untuk menyimpan perubahan

### **2. Supabase Dashboard**

1. **Buka Supabase Dashboard**

   - Kunjungi: https://supabase.com/dashboard
   - Pilih project Anda

2. **Update Site URL**

   - Pergi ke "Authentication" > "URL Configuration"
   - Set "Site URL" ke: `https://your-app-name.vercel.app`
   - Set "Redirect URLs" ke: `https://your-app-name.vercel.app/auth/callback`

3. **Verify Google Provider**
   - Pastikan Google provider masih enabled
   - Pastikan Client ID dan Secret masih benar

## 🚀 Deploy ke Vercel

### **1. Push ke GitHub**

```bash
git add .
git commit -m "Fix Google OAuth redirect for production"
git push origin main
```

### **2. Deploy di Vercel**

1. **Automatic Deploy**

   - Vercel akan otomatis deploy saat ada push ke GitHub
   - Tunggu deployment selesai

2. **Manual Deploy**
   - Jika perlu, bisa trigger manual deploy di Vercel Dashboard
   - Klik "Deploy" di project Anda

### **3. Verify Deployment**

1. **Check Environment Variables**

   - Pastikan semua environment variables sudah ter-set dengan benar
   - Bisa dicek di Vercel Dashboard > Settings > Environment Variables

2. **Test Google Login**
   - Buka aplikasi di production URL
   - Test login dengan Google
   - Pastikan redirect berfungsi dengan benar

## 🧪 Testing Checklist

### **✅ Pre-Deployment**

- [ ] Environment variables sudah di-set di Vercel
- [ ] Google OAuth redirect URIs sudah di-update
- [ ] Supabase site URL sudah di-update
- [ ] Code sudah di-push ke GitHub

### **✅ Post-Deployment**

- [ ] Aplikasi bisa diakses di production URL
- [ ] Google login button muncul
- [ ] Google login redirect ke URL yang benar
- [ ] User bisa login dengan Google
- [ ] Session tersimpan dengan benar
- [ ] User bisa logout

## 🔍 Troubleshooting

### **Masalah Umum:**

1. **"Invalid redirect URI"**

   ```
   Solution: Pastikan redirect URI di Google Console sesuai dengan production URL
   ```

2. **"Environment variable not found"**

   ```
   Solution: Pastikan NEXT_PUBLIC_SITE_URL sudah di-set di Vercel
   ```

3. **"CORS error"**

   ```
   Solution: Tambahkan production domain ke Supabase allowed origins
   ```

4. **"Site URL mismatch"**
   ```
   Solution: Update Site URL di Supabase Dashboard ke production URL
   ```

### **Debug Steps:**

1. **Check Vercel Logs**

   - Buka Vercel Dashboard > Functions > View Function Logs
   - Cari error messages

2. **Check Browser Console**

   - Buka Developer Tools (F12)
   - Check Console dan Network tabs
   - Cari error messages

3. **Check Environment Variables**
   - Pastikan semua variables sudah ter-set
   - Pastikan values sudah benar

## 📱 Production URL Examples

### **Vercel Default Domain**

```
https://your-app-name.vercel.app
```

### **Custom Domain**

```
https://yourdomain.com
```

### **Redirect URLs untuk Google OAuth**

```
https://your-app-name.vercel.app/auth/callback
https://your-project-id.supabase.co/auth/v1/callback
```

## 🔒 Security Notes

- ✅ Production menggunakan HTTPS
- ✅ Environment variables tidak exposed ke client
- ✅ OAuth redirects menggunakan secure URLs
- ✅ Session management ditangani oleh Supabase
- ✅ Error messages tidak menampilkan informasi sensitif

## 📞 Support

Jika masih ada masalah:

1. **Check Vercel Logs** untuk error messages
2. **Check Browser Console** untuk client-side errors
3. **Verify Environment Variables** di Vercel Dashboard
4. **Test di Incognito Mode** untuk memastikan tidak ada cache issues

Dengan setup ini, Google OAuth akan berfungsi dengan sempurna di production! 🎉
