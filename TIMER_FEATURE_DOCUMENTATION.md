# Timer Feature Documentation

## Overview
Fitur timer keseluruhan quiz telah diimplementasikan untuk memberikan kontrol waktu yang lebih baik pada game. Ketika timer habis, host akan otomatis diarahkan ke halaman leaderboard dan player akan diarahkan ke halaman result.

## Fitur yang Diimplementasikan

### 1. Timer Keseluruhan Quiz
- Timer dihitung berdasarkan `totalTimeLimit` yang diset di quiz settings
- Timer berjalan secara real-time dan tersinkronisasi antara host dan player
- Timer ditampilkan dalam format MM:SS

### 2. Auto-Redirect Ketika Timer Habis
- **Host**: Otomatis diarahkan ke `/leaderboard?roomCode={roomCode}`
- **Player**: Otomatis diarahkan ke `/result?roomCode={roomCode}`
- Game status diubah menjadi "finished" secara otomatis
- Broadcast event dikirim ke semua player untuk sinkronisasi

### 3. Peringatan Visual
- **Warning**: Ditampilkan ketika sisa waktu ≤ 60 detik
- **Time Up**: Ditampilkan ketika waktu habis (≤ 0 detik)
- Timer berubah warna menjadi merah dan berkedip ketika waktu hampir habis
- Notifikasi khusus ditampilkan di bagian atas halaman

### 4. Pencegahan Multiple Redirects
- Menggunakan state `timeUpHandled` untuk mencegah multiple redirects
- Callback `onTimeUp` hanya dipanggil sekali per session

## File yang Dimodifikasi

### 1. `hooks/use-synchronized-timer.ts`
- Menambahkan parameter `onTimeUp` callback
- Menambahkan logika untuk mendeteksi ketika timer habis
- Menambahkan `timeUpTriggered` ref untuk mencegah multiple calls

### 2. `app/game/[roomCode]/quiz/page.tsx`
- Menambahkan `handleTimeUp` function untuk player
- Menambahkan state `showTimeWarning` dan `timeUpHandled`
- Menambahkan UI warning dan time up notification
- Timer berubah warna dan style ketika waktu hampir habis

### 3. `app/monitor/page.tsx`
- Menambahkan `handleTimeUp` function untuk host
- Menambahkan state `showTimeWarning` dan `timeUpHandled`
- Menambahkan UI warning dan time up notification
- Timer berubah warna dan style ketika waktu hampir habis

## Cara Kerja

### 1. Timer Calculation
```typescript
// Timer dihitung berdasarkan startedAt atau createdAt
const gameStartTime = room.startedAt ? new Date(room.startedAt).getTime() : new Date(room.createdAt).getTime()
const elapsedSeconds = Math.floor((now - gameStartTime) / 1000)
const remainingTime = Math.max(0, totalTimeLimitSeconds - elapsedSeconds)
```

### 2. Time Up Detection
```typescript
// Deteksi ketika timer habis
if (newTimerState.remainingTime <= 0 && !timeUpTriggered.current && onTimeUp) {
  timeUpTriggered.current = true
  onTimeUp()
}
```

### 3. Auto-Redirect Logic
```typescript
// Host redirect ke leaderboard
if (!isHost) {
  window.location.href = `/result?roomCode=${roomCode}`
} else {
  window.location.href = `/leaderboard?roomCode=${roomCode}`
}
```

## UI Components

### 1. Timer Display
- Timer ditampilkan dalam format MM:SS
- Berubah warna menjadi merah ketika waktu hampir habis
- Berkedip (animate-pulse) ketika waktu habis

### 2. Warning Notifications
- **Warning**: "WAKTU HAMPIR HABIS!" dengan background merah
- **Time Up**: "WAKTU HABIS!" dengan background merah
- Animasi pulse untuk menarik perhatian

### 3. Visual Indicators
- Timer border berubah dari hijau ke merah
- Icon clock berubah warna
- Text berubah warna sesuai status

## Testing

### 1. Timer Functionality
- [x] Timer berjalan dengan benar
- [x] Timer tersinkronisasi antara host dan player
- [x] Timer berhenti ketika waktu habis

### 2. Auto-Redirect
- [x] Host diarahkan ke leaderboard
- [x] Player diarahkan ke result
- [x] Game status berubah menjadi "finished"
- [x] Broadcast event dikirim

### 3. UI/UX
- [x] Warning ditampilkan ketika sisa waktu ≤ 60 detik
- [x] Time up notification ditampilkan ketika waktu habis
- [x] Timer berubah warna dan style
- [x] Tidak ada multiple redirects

## Konfigurasi

### 1. Timer Settings
Timer dapat dikonfigurasi di quiz settings:
- Minimum: 5 menit
- Maximum: 60 menit
- Default: 10 menit
- Step: 5 menit

### 2. Warning Threshold
- Warning ditampilkan ketika sisa waktu ≤ 60 detik
- Dapat diubah dengan memodifikasi kondisi di useEffect

## Troubleshooting

### 1. Timer Tidak Berjalan
- Periksa apakah `room.startedAt` atau `room.createdAt` tersedia
- Periksa apakah `room.settings.totalTimeLimit` sudah diset

### 2. Auto-Redirect Tidak Berfungsi
- Periksa apakah `onTimeUp` callback sudah dipass ke `useSynchronizedTimer`
- Periksa apakah `timeUpHandled` state sudah diimplementasikan

### 3. Multiple Redirects
- Pastikan `timeUpHandled` state digunakan untuk mencegah multiple calls
- Pastikan `timeUpTriggered` ref digunakan di hook

## Future Enhancements

### 1. Customizable Warning Threshold
- Allow user to set custom warning time
- Multiple warning levels (5 min, 1 min, 30 sec)

### 2. Sound Notifications
- Audio warning when time is running low
- Audio notification when time is up

### 3. Pause/Resume Timer
- Allow host to pause timer
- Resume timer functionality

### 4. Timer Extensions
- Allow host to add extra time
- Maximum extension limits

## Conclusion

Fitur timer keseluruhan quiz telah berhasil diimplementasikan dengan:
- ✅ Timer real-time yang tersinkronisasi
- ✅ Auto-redirect ketika timer habis
- ✅ Visual warnings dan notifications
- ✅ Pencegahan multiple redirects
- ✅ UI/UX yang responsif dan informatif

Fitur ini memberikan kontrol waktu yang lebih baik pada game dan meningkatkan pengalaman pengguna dengan notifikasi yang jelas dan redirect otomatis yang smooth.
