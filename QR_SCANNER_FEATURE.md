# QR Scanner Feature - Join Game Page

## Overview

Fitur scan QR code telah ditambahkan ke halaman join game untuk memudahkan pemain bergabung ke room dengan cara memindai QR code.

## Implementasi

### 1. Library yang Digunakan

- **html5-qrcode**: Library yang stabil dan powerful untuk scanning QR code di web browser

  ```bash
  npm install html5-qrcode --save
  ```

  Library ini dipilih karena:

  - ✅ Lebih stabil dan mature
  - ✅ Support berbagai browser
  - ✅ Built-in camera handling
  - ✅ Excellent documentation
  - ✅ Active maintenance

### 2. Komponen Baru

- **components/qr-scanner.tsx**: Komponen modal QR scanner dengan fitur:
  - Akses kamera real-time
  - Permission handling untuk kamera
  - Visual feedback dengan scanning animation
  - Corner borders untuk guidance
  - Error handling jika camera tidak tersedia atau permission ditolak

### 3. Perubahan pada Join Page

- Tombol "SCAN" dengan icon camera ditambahkan di sebelah kanan label "ROOM CODE"
- Tombol ini muncul di kedua kondisi:
  - Saat room code kosong (manual input)
  - Saat room code sudah ada dari URL
- Ketika tombol diklik, akan membuka modal QR scanner
- Setelah QR code berhasil di-scan, room code otomatis terisi

### 4. CSS Additions

- Animation `scan-line` untuk visual effect scanning
- Styling untuk QR scanner modal dengan pixel art theme

## Cara Menggunakan

### Sebagai Pemain (Player):

1. Buka halaman join game: `/join`
2. Klik tombol "SCAN" di samping "ROOM CODE"
3. Izinkan akses kamera jika diminta browser
4. Arahkan kamera ke QR code yang ditampilkan oleh host
5. Room code akan otomatis terisi setelah QR berhasil di-scan
6. Isi username dan pilih avatar
7. Klik "JOIN ROOM"

### Sebagai Host:

- QR code sudah tersedia di halaman lobby (sebelumnya sudah ada)
- Pemain dapat scan QR code tersebut untuk langsung join

## Technical Details

### QR Scanner Component Props:

```typescript
interface QRScannerProps {
  onScan: (data: string) => void; // Callback ketika QR berhasil di-scan
  onClose: () => void; // Callback untuk menutup scanner
}
```

### Flow:

1. User klik tombol "SCAN"
2. State `showScanner` berubah menjadi `true`
3. QRScanner component dimount dan request akses kamera
4. Setelah permission granted, kamera aktif dan mulai scanning
5. Ketika QR code terdeteksi, `handleQRScan()` dipanggil
6. Room code di-extract dari URL/text yang di-scan
7. Room code input otomatis terisi
8. Scanner modal ditutup

### Error Handling:

- Camera tidak tersedia: Menampilkan pesan error
- Permission ditolak: Menampilkan pesan dan tombol close
- QR code tidak valid: Tidak ada action (terus scanning)

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 11+)
- Mobile browsers: ✅ Full support

## Security

- Camera access diminta secara explicit
- Permission harus di-grant oleh user
- Tidak ada recording/penyimpanan video
- Hanya text dari QR code yang di-process

## Future Improvements

- [ ] Tambah flash/torch toggle untuk kondisi gelap
- [ ] Multiple QR code format support
- [ ] Sound effect saat berhasil scan
- [ ] History scan untuk quick rejoin
