# 🌍 Multi-Language Support Setup Guide

## ✅ Apa yang Sudah Dibuat

### 1. **Instalasi Dependencies**

- `i18next` - Library internationalization utama
- `react-i18next` - React bindings untuk i18next
- `i18next-browser-languagedetector` - Deteksi bahasa otomatis

### 2. **Folder Locale** (`locale/`)

Tiga file bahasa sudah dibuat:

- **`locale/en.json`** - English (🇬🇧)
- **`locale/id.json`** - Bahasa Indonesia (🇮🇩)
- **`locale/zh.json`** - 中文 / Chinese (🇨🇳)

### 3. **Konfigurasi i18n** (`lib/i18n.ts`)

- Auto-detect bahasa browser
- Simpan pilihan bahasa di localStorage
- Fallback ke English jika bahasa tidak tersedia

### 4. **Language Selector Component** (`components/language-selector.tsx`)

- Mobile-friendly design
- Dropdown dengan flag emoji
- Check mark untuk bahasa aktif
- Smooth transition antar bahasa

### 5. **Integrasi**

- ✅ `app/layout.tsx` - I18nInitializer wrapper
- ✅ `app/page.tsx` - Menggunakan `useTranslation()` hook

## 🎯 Cara Menggunakan

### Cara Ganti Bahasa

1. Klik tombol **Menu** (☰) di kanan atas
2. Klik **"Language"** / **"Bahasa"** / **"语言"**
3. Pilih bahasa yang diinginkan:
   - 🇬🇧 **English**
   - 🇮🇩 **Bahasa Indonesia**
   - 🇨🇳 **中文 (Chinese)**
4. Halaman akan langsung berubah bahasa!

### Untuk Developer - Menambah Terjemahan Baru

#### 1. Tambahkan teks di file locale

**locale/en.json:**

```json
{
  "home": {
    "newText": "Hello World"
  }
}
```

**locale/id.json:**

```json
{
  "home": {
    "newText": "Halo Dunia"
  }
}
```

**locale/zh.json:**

```json
{
  "home": {
    "newText": "你好世界"
  }
}
```

#### 2. Gunakan di komponen

```tsx
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();

  return <div>{t("home.newText")}</div>;
}
```

## 📱 Mobile-Friendly Features

1. **Dropdown dengan Back Button** - Mudah navigasi di mobile
2. **Flag Emoji** - Visual yang jelas untuk setiap bahasa
3. **Touch-friendly buttons** - Ukuran touch target yang optimal
4. **Smooth animations** - Transisi yang halus

## 🔄 Cara Kerja

1. **Auto-detect**: Saat pertama kali buka, akan detect bahasa browser
2. **LocalStorage**: Pilihan bahasa disimpan di browser
3. **Persistent**: Bahasa tetap tersimpan setelah refresh/tutup browser

## 🚀 Testing

1. Jalankan dev server:

   ```bash
   npm run dev
   ```

2. Buka browser: `http://localhost:3000`

3. Test ganti bahasa:
   - Klik Menu → Language
   - Pilih bahasa berbeda
   - Cek apakah teks berubah

## 📝 Notes

- **TypeScript Errors**: Jika ada error TypeScript, restart IDE/TypeScript server
- **Cache**: Clear browser cache jika bahasa tidak update
- **New Pages**: Untuk halaman baru, tambahkan terjemahan di ketiga file locale

## 🎨 Struktur Translation Keys

```
locale/
├── en.json
│   ├── home (Homepage)
│   ├── menu (Menu items)
│   └── languages (Language names)
├── id.json
└── zh.json
```

## ✨ Fitur Tambahan yang Bisa Ditambahkan

1. **More languages** - Tambah bahasa lain (Jepang, Korea, dll)
2. **Date/Number formatting** - Format tanggal dan angka sesuai locale
3. **RTL Support** - Support bahasa Right-to-Left (Arabic, Hebrew)
4. **Dynamic loading** - Load translation files on-demand

---

**Created**: October 2025
**Status**: ✅ Ready to use!
