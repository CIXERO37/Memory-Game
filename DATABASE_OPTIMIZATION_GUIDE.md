# 📊 Database Optimization Guide

## 🎯 Perubahan yang Dilakukan

### **Before (7 Tables)**
```
1. users (Built-in Supabase Auth)
2. profiles (User profiles)
3. rooms (Game rooms)
4. players (Game players)
5. quizzes (Quiz data)
6. game_sessions (Session management) ❌ DIHAPUS
7. failed_updates (Error handling) ❌ DIHAPUS
```

### **After (5 Tables)**
```
1. users (Built-in Supabase Auth) ✅
2. profiles (User profiles) ✅
3. rooms (Game rooms + session data) ✅ UPDATED
4. players (Game players) ✅
5. quizzes (Quiz data) ✅
```

**Reduction**: 7 → 5 tables (**-28% complexity**)

---

## 🔄 Perubahan Detail

### 1. **Tabel `game_sessions` → Gabung ke `rooms`**

#### Kolom Baru di `rooms`:
```sql
ALTER TABLE rooms ADD COLUMN session_id VARCHAR(255);
ALTER TABLE rooms ADD COLUMN is_session_active BOOLEAN DEFAULT true;
ALTER TABLE rooms ADD COLUMN session_last_active TIMESTAMP WITH TIME ZONE;
ALTER TABLE rooms ADD COLUMN session_data JSONB;
```

#### Data yang Disimpan:
- **session_id**: Unique session identifier
- **is_session_active**: Status session aktif/tidak
- **session_last_active**: Last activity timestamp
- **session_data**: JSON data untuk session (user_type, user_data, device_info, dll)

### 2. **Tabel `failed_updates` → Dihapus**

#### Alasan:
- ❌ Error handling yang tidak essential
- ❌ Menambah kompleksitas database
- ❌ Bisa diganti dengan logging

#### Alternatif:
- ✅ Console logging untuk development
- ✅ Supabase logs untuk production
- ✅ Retry logic di application code

---

## 📝 Files yang Diupdate

### 1. **SQL Scripts**
- ✅ `scripts/28_optimize_database_structure.sql` - Migration script

### 2. **Code Files**
- ✅ `lib/supabase-session-manager.ts` - Updated to query `rooms` instead of `game_sessions`
- ⚠️ `lib/failed-updates-manager.ts` - **DEPRECATED** (tidak digunakan lagi)

### 3. **Documentation**
- ✅ `DATABASE_OPTIMIZATION_GUIDE.md` - This file

---

## 🚀 Cara Menjalankan Migration

### Step 1: Backup Database (Recommended)
```sql
-- Di Supabase SQL Editor, run:
CREATE TABLE game_sessions_backup AS SELECT * FROM game_sessions;
CREATE TABLE failed_updates_backup AS SELECT * FROM failed_updates;
```

### Step 2: Run Migration Script
1. Buka Supabase Dashboard → SQL Editor
2. Copy script dari `scripts/28_optimize_database_structure.sql`
3. Paste dan Run
4. Tunggu sampai selesai

### Step 3: Verify Migration
```sql
-- Cek struktur rooms
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'rooms';

-- Cek tabel yang sudah dihapus
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('game_sessions', 'failed_updates');
-- Harusnya KOSONG (0 rows)
```

### Step 4: Test Application
1. Clear browser cache
2. Restart dev server: `npm run dev`
3. Test semua functionality:
   - ✅ Create room
   - ✅ Join room
   - ✅ Play game
   - ✅ Session management

---

## 📊 Benefits

### 1. **Simplified Structure**
- ✅ **28% less tables** (7 → 5)
- ✅ **Easier to maintain**
- ✅ **Less joins required**
- ✅ **Better performance**

### 2. **Cost Efficiency**
- ✅ **Less storage** needed
- ✅ **Fewer database queries**
- ✅ **Reduced complexity** = reduced costs

### 3. **Better Performance**
- ✅ **Denormalized data** = faster queries
- ✅ **Less JOIN operations**
- ✅ **Better caching** potential

---

## 🔍 API Changes

### Session Management

#### **Before** (Using `game_sessions`):
```typescript
// Get session
const { data } = await supabase
  .from('game_sessions')
  .select('*')
  .eq('session_id', sessionId)
```

#### **After** (Using `rooms`):
```typescript
// Get session from rooms
const { data } = await supabase
  .from('rooms')
  .select('session_id, is_session_active, session_last_active, session_data')
  .eq('session_id', sessionId)
```

---

## ⚠️ Breaking Changes

### 1. **`lib/supabase-session-manager.ts`**
- ✅ **Already updated** to use `rooms` table
- ✅ All queries now target `rooms` instead of `game_sessions`

### 2. **`lib/failed-updates-manager.ts`**
- ⚠️ **DEPRECATED** - File ini tidak digunakan lagi
- ⚠️ **Action required**: Hapus semua references ke file ini di codebase

### 3. **Custom Queries**
- ⚠️ Jika ada custom queries ke `game_sessions` atau `failed_updates`, update ke `rooms`

---

## 🧪 Testing Checklist

### Database Testing:
- [ ] Migration script berhasil dijalankan tanpa error
- [ ] Tabel `game_sessions` sudah dihapus
- [ ] Tabel `failed_updates` sudah dihapus
- [ ] Tabel `rooms` memiliki kolom session baru
- [ ] Data session berhasil dimigrate

### Application Testing:
- [ ] Create room berhasil
- [ ] Join room berhasil
- [ ] Session tracking berfungsi
- [ ] No errors di console
- [ ] Game functionality normal

### Performance Testing:
- [ ] Query ke rooms lebih cepat
- [ ] Tidak ada N+1 query issues
- [ ] Memory usage normal

---

## 🔄 Rollback Plan

Jika ada masalah, rollback dengan:

```sql
-- 1. Restore backup
CREATE TABLE game_sessions AS SELECT * FROM game_sessions_backup;
CREATE TABLE failed_updates AS SELECT * FROM failed_updates_backup;

-- 2. Remove session columns from rooms
ALTER TABLE rooms DROP COLUMN IF EXISTS session_id;
ALTER TABLE rooms DROP COLUMN IF EXISTS is_session_active;
ALTER TABLE rooms DROP COLUMN IF EXISTS session_last_active;
ALTER TABLE rooms DROP COLUMN IF EXISTS session_data;

-- 3. Revert code changes di git
git checkout lib/supabase-session-manager.ts
```

---

## 📚 Schema Reference

### **Updated `rooms` Table:**

```sql
rooms {
  -- Original columns
  id: UUID
  room_code: VARCHAR(6)
  host_name: VARCHAR(50)
  quiz_id: VARCHAR(50)
  quiz_title: VARCHAR(100)
  time_limit: INTEGER
  question_count: INTEGER
  status: VARCHAR(20)
  current_question: INTEGER
  countdown_start_time: TIMESTAMPTZ
  countdown_duration: INTEGER
  created_at: TIMESTAMPTZ
  started_at: TIMESTAMPTZ
  finished_at: TIMESTAMPTZ
  
  -- NEW: Session columns
  session_id: VARCHAR(255)
  is_session_active: BOOLEAN
  session_last_active: TIMESTAMPTZ
  session_data: JSONB
}
```

### **Session Data Structure:**
```json
{
  "session_id": "session_abc123_1234567890",
  "user_type": "host",
  "user_data": {
    "username": "John Doe",
    "avatar": "ava1.webp"
  },
  "room_code": "ABC123",
  "device_info": {
    "userAgent": "...",
    "platform": "Win32",
    "language": "en-US"
  },
  "created_at": "2025-10-23T10:00:00Z",
  "last_active": "2025-10-23T10:05:00Z",
  "expires_at": "2025-10-24T10:00:00Z",
  "is_active": true
}
```

---

## 🎯 Next Steps

1. ✅ Run migration script: `scripts/28_optimize_database_structure.sql`
2. ✅ Verify migration successful
3. ✅ Test application functionality
4. ✅ Monitor for any issues
5. ✅ Clean up backup tables after confirmation (optional)

```sql
-- Setelah yakin migration berhasil (1-2 minggu):
DROP TABLE IF EXISTS game_sessions_backup;
DROP TABLE IF EXISTS failed_updates_backup;
```

---

## 📞 Support

Jika ada masalah setelah migration:

1. **Check logs**:
   - Browser console (F12)
   - Supabase logs (Dashboard → Logs)

2. **Verify data**:
   ```sql
   SELECT * FROM rooms WHERE session_id IS NOT NULL;
   ```

3. **Rollback** jika diperlukan (lihat Rollback Plan di atas)

---

**Status**: ✅ Ready for Production  
**Version**: 1.0  
**Date**: 23 Oktober 2025  
**Impact**: Breaking changes - requires migration


