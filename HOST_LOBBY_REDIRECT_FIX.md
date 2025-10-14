# Fix Host Redirect to Monitor Page

## Masalah yang Diperbaiki:

### ✅ Host Kembali ke Lobby Page Setelah Countdown (Bukan Monitor Page)

**Penyebab**:

- Lobby page menampilkan CountdownTimer saat `room.status === "countdown"`
- Setelah countdown selesai, `handleCountdownComplete` hanya memanggil `roomManager.startGame()`
- `roomManager.startGame()` mengubah room status dari "countdown" ke "quiz"
- Tapi lobby page tidak melakukan redirect ke monitor page
- Akibatnya host tetap di lobby page meskipun game sudah dimulai

**Solusi**:

1. **Redirect Langsung di Lobby**:

   - `handleCountdownComplete` sekarang melakukan redirect langsung ke monitor page
   - Menggunakan `router.push('/monitor?roomCode=${roomCode}')`
   - Menambahkan logging untuk debugging

2. **Logging untuk Debug**:
   - Menambahkan console.log untuk melacak room status
   - Menampilkan informasi redirect di console

## File yang Diubah:

### `app/lobby/page.tsx`

- ✅ `handleCountdownComplete` sekarang melakukan redirect ke monitor page
- ✅ Menambahkan logging untuk debugging room status
- ✅ Memastikan host tidak stuck di lobby page

## Cara Kerja:

1. **Host tekan "Start Quiz"** → Room status berubah ke "countdown"
2. **Lobby page menampilkan CountdownTimer** → Countdown dimulai
3. **Countdown selesai** → `handleCountdownComplete` dipanggil
4. **`roomManager.startGame()` dipanggil** → Room status berubah ke "quiz"
5. **`router.push('/monitor')` dipanggil** → Host redirect ke monitor page

## Cara Test:

### Test Host Redirect:

1. **Sebagai Host**:
   - Buka lobby page
   - Tekan "Start Quiz"
   - Tunggu countdown selesai
   - Harus redirect ke `/monitor?roomCode=XXXXX`
   - Check console untuk log: `[Lobby] Game started successfully, redirecting to monitor`

### Test Player Redirect:

1. **Sebagai Player**:
   - Join room sebagai player
   - Tunggu host start quiz
   - Tunggu countdown selesai
   - Harus redirect ke `/game/XXXXX/quiz?quizId=...`

### Test Room Status:

Check console untuk log berikut:

- `[Lobby] Showing countdown timer, room status: countdown`
- `[Lobby] Room status: quiz Game started: true`
- `[Lobby] Game started successfully, redirecting to monitor`

## Expected Behavior:

✅ **Host Redirect**: Host redirect ke monitor page setelah countdown
✅ **Player Redirect**: Player redirect ke quiz page setelah countdown  
✅ **Room Status**: Room status berubah dari "countdown" ke "quiz"
✅ **No Stuck**: Host tidak stuck di lobby page
✅ **Logging**: Console menampilkan informasi debugging yang jelas

## Debug Information:

Console akan menampilkan:

```
[Lobby] Showing countdown timer, room status: countdown
[Lobby] Game started successfully, redirecting to monitor
[Lobby] Room status: quiz Game started: true
```

## Perbedaan dengan Sebelumnya:

**Sebelum**:

- `handleCountdownComplete` hanya memanggil `roomManager.startGame()`
- Host tetap di lobby page meskipun game sudah dimulai
- Tidak ada redirect ke monitor page

**Sesudah**:

- `handleCountdownComplete` memanggil `roomManager.startGame()` DAN redirect ke monitor
- Host langsung redirect ke monitor page setelah countdown
- Room status berubah dengan benar
