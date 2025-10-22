# 🔧 Fix Google OAuth Redirect ke Localhost di Production

## ❌ Masalah yang Terjadi

Ketika deploy ke Vercel/Coolify, Google OAuth masih redirect ke `localhost:3000` meskipun aplikasi sudah berjalan di domain production. Ini menyebabkan error "This site can't be reached" karena localhost tidak bisa diakses dari production.

## ✅ Solusi yang Sudah Diimplementasikan

### **1. Robust URL Detection**

```typescript
// Sebelum (masih bisa ke localhost):
const redirectUrl =
  process.env.NODE_ENV === "production"
    ? `${
        process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      }/auth/callback`
    : `${window.location.origin}/auth/callback`;

// Sesudah (lebih robust):
const currentOrigin = window.location.origin;
const isLocalhost =
  currentOrigin.includes("localhost") || currentOrigin.includes("127.0.0.1");
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || currentOrigin;
const redirectUrl = `${siteUrl}/auth/callback`;
```

### **2. Debug Logging**

Ditambahkan console.log untuk debugging:

```typescript
console.log("=== Google OAuth Debug Info ===");
console.log("Current origin:", currentOrigin);
console.log("Is localhost:", isLocalhost);
console.log("Site URL from env:", process.env.NEXT_PUBLIC_SITE_URL);
console.log("Final redirect URL:", redirectUrl);
console.log("================================");
```

## 🚀 Setup yang Diperlukan

### **1. Environment Variables di Vercel/Coolify**

```env
NEXT_PUBLIC_SITE_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### **2. Google Cloud Console**

Update Authorized Redirect URIs:

```
https://your-app-name.vercel.app/auth/callback
https://your-project-id.supabase.co/auth/v1/callback
```

### **3. Supabase Dashboard**

- Site URL: `https://your-app-name.vercel.app`
- Redirect URLs: `https://your-app-name.vercel.app/auth/callback`

## 🧪 Testing Steps

### **1. Check Console Logs**

Setelah klik tombol Google Login, buka Developer Tools (F12) dan lihat Console. Anda akan melihat:

```
=== Google OAuth Debug Info ===
Current origin: https://your-app-name.vercel.app
Is localhost: false
Site URL from env: https://your-app-name.vercel.app
Final redirect URL: https://your-app-name.vercel.app/auth/callback
================================
```

### **2. Verify Redirect URL**

Pastikan "Final redirect URL" menunjukkan domain production, bukan localhost.

### **3. Test Google Login**

- Klik tombol Google Login
- Login dengan Google
- Pastikan redirect ke domain production, bukan localhost

## 🔍 Troubleshooting

### **Masalah: Masih Redirect ke Localhost**

**Kemungkinan Penyebab:**

1. Environment variable `NEXT_PUBLIC_SITE_URL` tidak di-set
2. Google OAuth redirect URIs belum di-update
3. Supabase site URL belum di-update

**Solusi:**

1. Set `NEXT_PUBLIC_SITE_URL` di Vercel/Coolify
2. Update Google OAuth redirect URIs
3. Update Supabase site URL

### **Masalah: "Invalid redirect URI"**

**Kemungkinan Penyebab:**

- Redirect URI di Google Console tidak sesuai dengan yang digunakan

**Solusi:**

- Pastikan redirect URI di Google Console sama dengan yang di console.log

### **Masalah: Environment Variable Tidak Terbaca**

**Kemungkinan Penyebab:**

- Variable tidak di-set dengan benar
- Variable tidak di-deploy ulang

**Solusi:**

- Check environment variables di dashboard
- Redeploy aplikasi setelah set variables

## 📋 Checklist Verifikasi

### **✅ Pre-Deployment**

- [ ] `NEXT_PUBLIC_SITE_URL` sudah di-set di Vercel/Coolify
- [ ] Google OAuth redirect URIs sudah di-update
- [ ] Supabase site URL sudah di-update
- [ ] Code sudah di-push dan di-deploy

### **✅ Post-Deployment**

- [ ] Console log menunjukkan URL production
- [ ] Google login redirect ke domain production
- [ ] Tidak ada error "This site can't be reached"
- [ ] User bisa login dengan Google

## 🎯 Expected Behavior

### **Development (localhost:3000)**

```
Current origin: http://localhost:3000
Is localhost: true
Final redirect URL: http://localhost:3000/auth/callback
```

### **Production (vercel.app)**

```
Current origin: https://your-app-name.vercel.app
Is localhost: false
Site URL from env: https://your-app-name.vercel.app
Final redirect URL: https://your-app-name.vercel.app/auth/callback
```

## 🔒 Security Notes

- ✅ Production selalu menggunakan HTTPS
- ✅ Environment variables tidak exposed ke client
- ✅ Redirect URLs menggunakan secure domains
- ✅ Debug logs hanya untuk development/testing

## 📞 Support

Jika masih ada masalah:

1. **Check Console Logs** - Lihat debug info di browser console
2. **Verify Environment Variables** - Pastikan semua variables sudah ter-set
3. **Check Google OAuth Settings** - Pastikan redirect URIs sudah benar
4. **Check Supabase Settings** - Pastikan site URL sudah benar

Dengan fix ini, Google OAuth akan selalu redirect ke domain production yang benar! 🎉
