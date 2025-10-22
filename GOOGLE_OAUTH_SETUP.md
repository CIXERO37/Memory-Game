# Panduan Setup Google OAuth dengan Supabase

## ✅ Fitur yang Sudah Ditambahkan

### 1. **Tombol Google Login**

- Tombol Google OAuth dengan desain pixel-art yang konsisten
- Loading state dengan spinner
- Error handling yang proper
- Responsive design untuk mobile dan desktop

### 2. **Auth Callback Handler**

- File `app/auth/callback/page.tsx` untuk menangani redirect dari Google
- Loading screen yang menarik
- Error handling dan redirect yang tepat

## 🔧 Setup yang Diperlukan

### 1. **Google Cloud Console Setup**

**Langkah-langkah:**

1. **Buka Google Cloud Console**

   - Kunjungi: https://console.developers.google.com/
   - Login dengan akun Google

2. **Buat/Select Project**

   - Klik "Select a project" di bagian atas
   - Klik "New Project" atau pilih project yang sudah ada

3. **Enable Google+ API**

   - Di sidebar kiri, pilih "APIs & Services" > "Library"
   - Cari "Google+ API" dan klik "Enable"

4. **Buat OAuth 2.0 Credentials**

   - Pergi ke "APIs & Services" > "Credentials"
   - Klik "Create Credentials" > "OAuth 2.0 Client IDs"
   - Pilih "Web application" sebagai Application type

5. **Konfigurasi Redirect URIs**

   ```
   Authorized redirect URIs:
   - http://localhost:3000/auth/callback (untuk development)
   - https://yourdomain.com/auth/callback (untuk production)
   - https://your-project-id.supabase.co/auth/v1/callback (untuk Supabase)
   ```

6. **Simpan Credentials**
   - Copy **Client ID** dan **Client Secret**
   - Simpan untuk digunakan di Supabase

### 2. **Supabase Dashboard Setup**

**Langkah-langkah:**

1. **Buka Supabase Dashboard**

   - Kunjungi: https://supabase.com/dashboard
   - Pilih project Anda

2. **Konfigurasi Authentication**

   - Di sidebar kiri, pilih "Authentication"
   - Klik tab "Providers"

3. **Enable Google Provider**

   - Scroll ke bagian "Google"
   - Toggle "Enable sign in with Google" menjadi ON

4. **Masukkan Google Credentials**

   - **Client ID**: Masukkan Client ID dari Google Console
   - **Client Secret**: Masukkan Client Secret dari Google Console

5. **Set Redirect URL**
   - Pastikan redirect URL sudah benar: `https://your-project-id.supabase.co/auth/v1/callback`

### 3. **Environment Variables**

**Pastikan file `.env.local` sudah dikonfigurasi:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🧪 Testing

### 1. **Start Development Server**

```bash
npm run dev
```

### 2. **Test Google Login**

- Buka halaman login: `http://localhost:3000/login`
- Klik tombol "GOOGLE"
- Login dengan akun Google
- Pastikan redirect ke halaman utama

### 3. **Check Session**

- Pastikan user info muncul di menu
- Test logout functionality

## 🎨 Fitur UI yang Ditambahkan

### **Google Login Button**

- **Design**: Pixel-art style dengan gradient merah-orange
- **Icon**: SVG Google logo yang responsif
- **Loading State**: Spinner dengan text "CONNECTING..."
- **Hover Effect**: Scale transform dan smooth transition
- **Responsive**: Ukuran yang berbeda untuk mobile dan desktop

### **Divider**

- Garis pemisah dengan text "OR"
- Styling yang konsisten dengan tema pixel-art

### **Error Handling**

- Error message yang muncul di bawah tombol Google
- Styling yang konsisten dengan error messages lainnya

## 🔍 Troubleshooting

### **Masalah Umum:**

1. **"Invalid redirect URI"**

   - Pastikan redirect URI di Google Console sesuai dengan yang digunakan
   - Check apakah menggunakan http vs https

2. **"Client ID not found"**

   - Pastikan Client ID dan Secret sudah benar di Supabase
   - Pastikan Google provider sudah di-enable

3. **"CORS error"**

   - Tambahkan domain ke allowed origins di Supabase
   - Check apakah menggunakan domain yang benar

4. **"Email not verified"**
   - Check email confirmation settings di Supabase
   - Pastikan email sudah diverifikasi

### **Tips Debugging:**

- Buka browser Developer Tools (F12)
- Check tab "Network" untuk melihat request yang dibuat
- Check tab "Console" untuk error messages
- Test di incognito mode untuk memastikan tidak ada cache issues

## 📱 Responsive Design

- **Mobile**: Tombol dengan tinggi 12 (h-12)
- **Desktop**: Tombol dengan tinggi 14 (h-14)
- **Icon**: Ukuran yang berbeda untuk mobile dan desktop
- **Text**: Font size yang responsif

## 🔒 Security Notes

- OAuth redirects menggunakan HTTPS di production
- Session management ditangani oleh Supabase
- Error messages tidak menampilkan informasi sensitif
- Callback URL sudah dikonfigurasi dengan benar

Dengan setup ini, Google OAuth akan terintegrasi dengan sempurna ke aplikasi Anda!
