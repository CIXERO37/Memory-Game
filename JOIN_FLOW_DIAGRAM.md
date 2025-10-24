# Join Game Flow - Diagram

## Skenario: Orang Awam Pertama Kali Akses Web

### 🎯 **Flow yang Sudah Diimplementasikan:**

```
📱 QR Code/Link: http://localhost:3000/join?room=P7ZWW3
         ↓
👤 Pengguna Awam (Belum Login)
         ↓
🔒 AuthGuard Mendeteksi: !isAuthenticated && isJoinRoute && hasRoomCode
         ↓
🔄 Redirect ke: /login?redirect=/join&room=P7ZWW3
         ↓
📝 Halaman Login (dengan parameter redirect tersimpan)
         ↓
🔐 Pengguna Login (Google OAuth atau Email/Password)
         ↓
✅ AuthGuard Mendeteksi: isAuthenticated && pathname === '/login' && redirectPath === '/join'
         ↓
🎮 Redirect ke: /join?room=P7ZWW3 (Room code sudah terisi otomatis)
         ↓
✅ Pengguna bisa langsung join game!
```

### 🔧 **Kode yang Menangani Flow Ini:**

#### 1. **AuthGuard** (`components/auth-guard.tsx`)

```typescript
// Deteksi pengguna belum login yang akses join dengan room code
if (!isAuthenticated && !isPublicRoute) {
  if (isJoinRoute && hasRoomCode) {
    const roomCode = new URLSearchParams(window.location.search).get("room");
    router.push(`/login?redirect=/join&room=${roomCode}`);
  }
}

// Deteksi pengguna sudah login di halaman login dengan parameter redirect
if (isAuthenticated && pathname === "/login") {
  const redirectPath = urlParams.get("redirect");
  const roomCode = urlParams.get("room");

  if (redirectPath === "/join" && roomCode) {
    router.push(`/join?room=${roomCode}`);
  }
}
```

#### 2. **Login Page** (`app/login/page.tsx`)

- Menerima parameter `redirect` dan `room` dari URL
- Meneruskan parameter ke OAuth callback untuk Google login

#### 3. **Auth Callback** (`app/auth/callback/page.tsx`)

- Menangani redirect setelah OAuth berhasil
- Meneruskan room code ke halaman join

### ✅ **Hasil Akhir:**

- Pengguna awam bisa scan QR code atau klik link
- Otomatis diarahkan ke login (dengan room code tersimpan)
- Setelah login, otomatis diarahkan ke join dengan room code sudah terisi
- **Tidak perlu input room code manual!**

### 🧪 **Test dengan URL dari Gambar:**

1. Buka: `http://localhost:3000/join?room=P7ZWW3`
2. Pastikan redirect ke: `/login?redirect=/join&room=P7ZWW3`
3. Login dengan Google atau email/password
4. Pastikan redirect ke: `/join?room=P7ZWW3` (room code sudah terisi)
