# 📝 Perubahan Nama Table: `users_profile` → `profiles`

## ✅ Perubahan yang Dilakukan

Nama table untuk user profile **DIUBAH** dari `users_profile` menjadi `profiles`

### Alasan Perubahan:

1. ✅ **Lebih sederhana** - `profiles` lebih pendek dan mudah diingat
2. ✅ **Best practice** - Mengikuti konvensi Supabase (mereka gunakan `profiles`)
3. ✅ **Konsisten** - Nama table umumnya singular atau plural yang clear
4. ✅ **Lebih clean** - Menghindari redundansi (`users_profile` vs `profiles`)

---

## 📋 Files yang Sudah Diupdate

### 1. Scripts SQL:

- ✅ `scripts/27_fix_existing_users_profile.sql` - Migration script (GUNAKAN INI!)
  - Table name: `profiles`
  - Policies updated
  - Indexes updated: `idx_profiles_email`, `idx_profiles_username`
  - Trigger updated

### 2. Documentation:

- ✅ `JALANKAN_INI_SEKARANG.md` - Quick guide
- ✅ `QUICK_FIX_GOOGLE_LOGIN.md` - Updated quick reference
- ✅ `PERUBAHAN_TABLE_NAME.md` - This file (summary of changes)

### 3. Code Files:

- ✅ `app/auth/callback/page.tsx` - Already updated (callback handler)
- ⏳ `hooks/use-auth.ts` - **BELUM** (perlu update jika query ke table)
- ⏳ Other files yang query profile table - **BELUM**

---

## 🎯 Yang Perlu Dilakukan

### ✅ SUDAH SELESAI:

1. Update script SQL menjadi `profiles`
2. Update dokumentasi panduan
3. Update callback handler

### ⏳ MASIH PERLU:

1. Cek apakah ada file lain yang query table profile
2. Update nama table di query jika ada

---

## 🔍 Cara Cek Files Yang Perlu Update

Jalankan search ini di project:

```bash
# Search untuk "users_profile" di semua files
grep -r "users_profile" . --exclude-dir=node_modules
```

---

## 📊 Schema Table `profiles`

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    username VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes:

- `idx_profiles_email` - Index on email column
- `idx_profiles_username` - Index on username column

### RLS Policies:

- "Service role can do anything" - Full access for service role
- "Authenticated users can view all profiles" - All auth users can read
- "Users can view own profile" - Anon users can read own profile
- "Users can insert own profile" - Auth users can insert own
- "Users can update own profile" - Auth users can update own

### Trigger:

- `on_auth_user_created` - Auto-create profile when user signs up

---

## ✅ Next Steps

1. **Run migration script** di Supabase (`scripts/27_fix_existing_users_profile.sql`)
2. **Verify** table `profiles` berhasil dibuat
3. **Test** Google login
4. **Check** apakah ada code lain yang perlu update

---

## 📞 Jika Ada Masalah

Jika setelah update ada error:

### Error: "relation 'users_profile' does not exist"

**Artinya**: Ada code yang masih query ke table lama

**Fix**:

1. Cari file yang error
2. Update nama table dari `users_profile` ke `profiles`

---

## 🎉 Summary

**Before**: `users_profile`  
**After**: `profiles`

**Status**: ✅ SQL scripts updated, documentation updated  
**Action Required**: Run migration script di Supabase  
**Impact**: Cleaner, more standard table naming

---

**Updated**: 23 Oktober 2025  
**Version**: 2.0  
**Table Name**: `profiles` ✅

