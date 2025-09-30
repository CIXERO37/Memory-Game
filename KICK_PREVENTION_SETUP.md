# Kick Prevention Setup

## Overview

Sistem kick prevention yang diperkuat untuk mencegah player yang sudah di-kick oleh host untuk bergabung kembali ke room yang sama.

## Database Setup

### 1. Jalankan SQL Script

Jalankan script berikut di Supabase SQL Editor:

```sql
-- File: scripts/09_create_kicked_players_table.sql
```

### 2. Verifikasi Tabel

Pastikan tabel `kicked_players` sudah dibuat dengan struktur:

- `id` (UUID, Primary Key)
- `room_id` (UUID, Foreign Key ke rooms)
- `player_username` (VARCHAR(50))
- `player_id` (UUID, optional)
- `kicked_by_host` (VARCHAR(50))
- `kicked_at` (TIMESTAMP)
- `reason` (VARCHAR(255))

## Fitur Kick Prevention

### 1. Server-Side Validation

- **Database Tracking**: Player yang di-kick disimpan di tabel `kicked_players`
- **Join Validation**: Setiap kali player mencoba join, sistem mengecek database
- **Rejoin Validation**: Player yang di-kick tidak bisa rejoin dengan username yang sama

### 2. Client-Side Validation

- **Local Storage**: Backup validation di browser
- **Room-Specific List**: `kicked-{roomCode}` untuk setiap room
- **Global List**: `kicked-players` untuk tracking global
- **Multiple Checks**: Validasi di beberapa level

### 3. Multi-Layer Protection

#### Layer 1: Client-Side (Immediate)

```javascript
// Room-specific check
const kickedPlayers = localStorage.getItem(`kicked-${roomCode}`);
if (kickedPlayers && kickedList.includes(username)) {
  // Block join
}

// Global check
const globalKicked = localStorage.getItem(`kicked-players`);
if (globalKicked && wasKicked) {
  // Block join
}
```

#### Layer 2: Server-Side (Reliable)

```javascript
// Database check
const isKicked = await roomManager.isPlayerKicked(roomCode, username);
if (isKicked) {
  // Block join
}
```

#### Layer 3: Database Constraints

```sql
-- Function to check if player was kicked
SELECT is_player_kicked_from_room('ROOM123', 'username');

-- Function to add kicked player
SELECT add_kicked_player('ROOM123', 'username', 'player_id', 'Host', 'Kicked by host');
```

## Alur Kerja Kick Prevention

### 1. Host Kicks Player

```
Host clicks kick → Confirm dialog → roomManager.kickPlayer() →
Supabase: Add to kicked_players table → Delete from players table →
Broadcast to all players → Player redirected
```

### 2. Player Tries to Rejoin

```
Player enters room code → Join page validation:
├── Client-side checks (localStorage)
├── Server-side check (database)
└── If kicked: "You were kicked from this room. You cannot rejoin."
```

### 3. Multiple Validation Points

- **Join Page**: Validasi sebelum join
- **JoinRoom Method**: Validasi di server
- **RejoinRoom Method**: Validasi untuk rejoin
- **Database Functions**: SQL-level validation

## Testing

### Test Cases

1. **Host kicks player** → Player tidak bisa join lagi
2. **Player tries different username** → Masih bisa join (username berbeda)
3. **Player tries same username** → Diblokir
4. **Room deleted and recreated** → Kicked list tetap ada
5. **Browser cleared** → Server-side validation masih bekerja

### Manual Testing

1. Host buat room
2. Player join room
3. Host kick player
4. Player coba join lagi dengan username sama → Diblokir
5. Player coba join dengan username berbeda → Bisa join

## Troubleshooting

### Common Issues

1. **Player masih bisa join**: Cek apakah database script sudah dijalankan
2. **Error di console**: Cek Supabase connection dan permissions
3. **LocalStorage cleared**: Server-side validation harus tetap bekerja

### Debug Commands

```sql
-- Check kicked players for a room
SELECT * FROM kicked_players kp
JOIN rooms r ON kp.room_id = r.id
WHERE r.room_code = 'ROOM123';

-- Check if specific player was kicked
SELECT is_player_kicked_from_room('ROOM123', 'username');
```

## Security Notes

### Client-Side Limitations

- LocalStorage bisa di-clear oleh user
- Client-side validation bisa di-bypass
- **Server-side validation adalah yang utama**

### Best Practices

- Selalu gunakan server-side validation
- Client-side hanya untuk UX improvement
- Database constraints sebagai last resort
- Log semua kick actions untuk audit

## Files Modified

### Database

- `scripts/09_create_kicked_players_table.sql` (NEW)

### Backend

- `lib/supabase-room-manager.ts` - Added kicked players tracking
- `lib/room-manager.ts` - Added isPlayerKicked method

### Frontend

- `app/join/page.tsx` - Enhanced validation
- `app/waiting-room/[roomCode]/page.tsx` - Enhanced kick handling

## Migration Notes

### Existing Rooms

- Rooms yang sudah ada tidak terpengaruh
- Kicked players list hanya berlaku untuk kick yang terjadi setelah update

### Backward Compatibility

- Sistem tetap bekerja dengan rooms lama
- Tidak ada breaking changes
- Graceful fallback jika database check gagal
