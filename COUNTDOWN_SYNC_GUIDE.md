# Countdown Timer Synchronization System

## Overview

Sistem sinkronisasi countdown timer yang memastikan semua player melihat countdown yang sama meskipun ada masalah koneksi jaringan.

## Components

### 1. API Endpoints

#### `/api/rooms/[roomCode]/countdown-state` (GET)

- Mengembalikan status countdown dari server dengan waktu server yang akurat
- Menghitung sisa waktu countdown berdasarkan `countdown_start_time` dan `countdown_duration`
- Menyediakan `serverTime` untuk sinkronisasi waktu client-server

#### `/api/rooms/[roomCode]/heartbeat` (POST)

- Mengirim heartbeat dari client ke server
- Mencatat `last_heartbeat` dan `client_time_offset` untuk monitoring koneksi
- Membantu server mengetahui status koneksi player

### 2. Custom Hook: `useServerSynchronizedCountdown`

#### Features:

- **Server-side synchronization**: Menggunakan waktu server sebagai referensi utama
- **Client offset calculation**: Menghitung perbedaan waktu client-server
- **Automatic reconnection**: Otomatis mencoba reconnect jika koneksi terputus
- **Heartbeat monitoring**: Mengirim heartbeat setiap 5 detik
- **Smooth animation**: Menggunakan `requestAnimationFrame` untuk animasi yang smooth

#### Parameters:

- `roomCode`: Kode ruangan
- `playerId`: ID player (optional)
- `onCountdownComplete`: Callback ketika countdown selesai

#### Returns:

- `countdown`: Sisa waktu countdown dalam detik
- `isActive`: Apakah countdown sedang aktif
- `isConnected`: Status koneksi ke server
- `serverOffset`: Offset waktu client-server

### 3. Component: `CountdownTimer`

#### Features:

- **Visual countdown**: Menampilkan angka countdown dengan animasi
- **Connection status**: Indikator status koneksi (SYNCED/RECONNECTING)
- **Retro styling**: Desain pixel-art yang konsisten dengan game
- **Responsive**: Bekerja di berbagai ukuran layar

## How It Works

### 1. Countdown Start

1. Host menekan "Start Quiz" di lobby
2. Server menyimpan `countdown_start_time` dan `countdown_duration`
3. Room status berubah menjadi "countdown"
4. Semua player diarahkan ke halaman countdown

### 2. Synchronization Process

1. Client memanggil `/api/rooms/[roomCode]/countdown-state` setiap 1 detik
2. Server menghitung sisa waktu berdasarkan waktu server saat ini
3. Client menerima `serverTime` dan menghitung offset waktu
4. Client menggunakan waktu sinkronisasi untuk menampilkan countdown

### 3. Connection Monitoring

1. Client mengirim heartbeat setiap 5 detik ke `/api/rooms/[roomCode]/heartbeat`
2. Server mencatat `last_heartbeat` dan `client_time_offset`
3. Jika koneksi terputus, client otomatis mencoba reconnect setiap 2 detik
4. Indikator koneksi berubah menjadi "RECONNECTING..." saat terputus

### 4. Reconnection Logic

1. Jika API call gagal, status `isConnected` menjadi `false`
2. Client mulai countdown 5 detik untuk auto-reconnect
3. Setelah 5 detik, client mencoba fetch countdown state lagi
4. Jika berhasil, status kembali `true` dan countdown dilanjutkan
5. Jika gagal, proses diulang dengan delay 2 detik

## Benefits

### 1. Network Resilience

- Player dengan sinyal jelek tetap melihat countdown yang sinkron
- Otomatis reconnect jika koneksi terputus sementara
- Tidak ada drift waktu antara player

### 2. Real-time Synchronization

- Semua player melihat countdown yang sama persis
- Waktu server sebagai sumber kebenaran tunggal
- Offset waktu client-server dikompensasi

### 3. User Experience

- Indikator koneksi yang jelas
- Animasi yang smooth meskipun ada lag
- Auto-reconnect tanpa intervensi user

## Usage Example

```tsx
// Di halaman countdown
const { countdown, isActive, isConnected } = useServerSynchronizedCountdown(
  roomCode,
  playerId,
  () => {
    // Redirect ke quiz ketika countdown selesai
    window.location.href = `/game/${roomCode}/quiz`
  }
)

// Di komponen CountdownTimer
<CountdownTimer
  room={room}
  playerId={playerId}
  onCountdownComplete={handleCountdownComplete}
/>
```

## Database Schema

### Rooms Table

```sql
- countdown_start_time: timestamp (kapan countdown dimulai)
- countdown_duration: integer (durasi countdown dalam detik)
- status: enum ('waiting', 'countdown', 'quiz', 'memory', 'finished')
```

### Players Table

```sql
- last_heartbeat: timestamp (heartbeat terakhir)
- client_time_offset: integer (offset waktu client-server dalam ms)
```

## Error Handling

1. **Network Timeout**: Auto-retry dengan exponential backoff
2. **Server Error**: Fallback ke countdown lokal dengan warning
3. **Invalid Room**: Redirect ke halaman utama
4. **Player Kicked**: Redirect ke halaman join

## Performance Considerations

- API calls dibatasi maksimal 1 detik untuk menghindari spam
- Heartbeat hanya setiap 5 detik untuk mengurangi load
- RequestAnimationFrame untuk animasi yang efisien
- Caching response untuk mengurangi network calls
