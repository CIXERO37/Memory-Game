# 🗑️ Database Cleanup Instructions

## Tabel yang Akan Dihapus

Script `scripts/11_cleanup_unused_tables.sql` akan menghapus tabel-tabel berikut yang tidak digunakan lagi:

1. ❌ **`game_states`** - Tidak ada referensi dalam kode
2. ❌ **`player_answers`** - Tidak ada referensi dalam kode
3. ❌ **`memory_game_results`** - Tidak ada referensi dalam kode
4. ❌ **`user_sessions`** - Tidak ada referensi dalam kode
5. ❌ **`kicked_players`** - Tidak ada referensi dalam kode

## Tabel yang Tetap Dipertahankan

✅ **Tabel Aktif** (masih digunakan dalam aplikasi):

- `rooms` - Digunakan di `lib/supabase-room-manager.ts`
- `players` - Digunakan di `lib/supabase-room-manager.ts`
- `quizzes` - Digunakan di `lib/supabase.ts`
- `game_sessions` - Digunakan di `lib/supabase-session-manager.ts`
- `failed_updates` - Digunakan di `lib/failed-updates-manager.ts`

## ⚠️ PERINGATAN PENTING

**BACKUP DATABASE TERLEBIH DAHULU!** Script ini akan menghapus tabel dan semua data di dalamnya secara permanen.

## Cara Menjalankan Cleanup

### Opsi 1: Via Supabase Dashboard

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Masuk ke **SQL Editor**
4. Copy-paste isi file `scripts/11_cleanup_unused_tables.sql`
5. Klik **Run** untuk mengeksekusi

### Opsi 2: Via psql Command Line

```bash
# Jika menggunakan psql
psql -h your-db-host -U your-username -d your-database -f scripts/11_cleanup_unused_tables.sql
```

### Opsi 3: Via Supabase CLI

```bash
# Jika menggunakan Supabase CLI
supabase db reset --linked
# atau
supabase db push
```

## Apa yang Dilakukan Script

1. **Cek Data** - Menampilkan jumlah records di setiap tabel yang akan dihapus
2. **Drop Indexes** - Menghapus semua index yang terkait
3. **Drop Functions** - Menghapus functions yang tidak digunakan
4. **Drop Triggers** - Menghapus triggers yang tidak digunakan
5. **Drop Tables** - Menghapus tabel dengan CASCADE
6. **Verification** - Menampilkan tabel yang tersisa

## Setelah Cleanup

Setelah menjalankan script, Anda akan memiliki database yang lebih bersih dengan hanya tabel-tabel yang benar-benar digunakan:

- ✅ Database lebih ringan
- ✅ Maintenance lebih mudah
- ✅ Performa lebih optimal
- ✅ Struktur lebih jelas

## Rollback (Jika Diperlukan)

Jika Anda perlu mengembalikan tabel yang sudah dihapus:

1. Restore dari backup database
2. Atau jalankan ulang script pembuatan tabel dari `scripts/01_create_tables.sql` dan script terkait lainnya

---

**Dibuat pada:** $(date)  
**Status:** Ready untuk dieksekusi

