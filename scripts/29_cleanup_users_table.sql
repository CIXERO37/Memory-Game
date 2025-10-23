-- =========================================
-- Cleanup Users Table - Remove Unnecessary Fields
-- =========================================
-- 
-- Menghapus field yang tidak penting dari tabel users
-- Field game progress seharusnya ada di tabel players, bukan users
-- 
-- Fields yang akan dihapus:
-- 1. is_host - sudah ada di players
-- 2. current_room_id - sudah ada di players (room_id)
-- 3. quiz_progress - game data, seharusnya di players
-- 4. memory_return_data - game data, seharusnya di players
-- 5. questions_answered - game data, seharusnya di players
-- 6. memory_cards_found - game data, seharusnya di players
-- 7. total_score - game data, seharusnya di players
-- 8. completed_at - game data, seharusnya di players
--
-- Fields yang dipertahankan:
-- 1. id - primary key
-- 2. username - identitas user
-- 3. avatar_url - profil user
-- 4. email - identitas user
-- 5. created_at - metadata
-- 6. updated_at - metadata
-- 7. joined_at - metadata (bisa digabung dengan created_at)
-- 8. is_active - status user
-- =========================================

-- Step 1: Backup data sebelum dihapus (opsional, untuk safety)
DO $$
BEGIN
    -- Cek apakah tabel users ada di schema public
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) THEN
        -- Backup data game progress sebelum dihapus
        CREATE TABLE IF NOT EXISTS users_game_data_backup AS 
        SELECT 
            id,
            is_host,
            current_room_id,
            quiz_progress,
            memory_return_data,
            questions_answered,
            memory_cards_found,
            total_score,
            completed_at,
            created_at
        FROM users
        WHERE quiz_progress IS NOT NULL 
           OR memory_return_data IS NOT NULL
           OR questions_answered > 0
           OR memory_cards_found > 0
           OR total_score > 0;
        
        RAISE NOTICE 'Game data backed up to users_game_data_backup';
    ELSE
        RAISE NOTICE 'users table does not exist in public schema, skipping backup';
    END IF;
END $$;

-- Step 2: Tampilkan informasi field yang akan dihapus
DO $$
DECLARE
    users_count INTEGER;
    fields_to_drop TEXT[];
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) THEN
        SELECT COUNT(*) INTO users_count FROM users;
        
        RAISE NOTICE '=== CLEANUP USERS TABLE ===';
        RAISE NOTICE 'Total users: %', users_count;
        RAISE NOTICE '';
        RAISE NOTICE 'Fields yang akan dihapus:';
        RAISE NOTICE '1. is_host (sudah ada di players)';
        RAISE NOTICE '2. current_room_id (sudah ada di players)';
        RAISE NOTICE '3. quiz_progress (game data)';
        RAISE NOTICE '4. memory_return_data (game data)';
        RAISE NOTICE '5. questions_answered (game data)';
        RAISE NOTICE '6. memory_cards_found (game data)';
        RAISE NOTICE '7. total_score (game data)';
        RAISE NOTICE '8. completed_at (game data)';
        RAISE NOTICE '';
        RAISE NOTICE 'Fields yang dipertahankan:';
        RAISE NOTICE '1. id, username, avatar_url, email';
        RAISE NOTICE '2. created_at, updated_at, joined_at, is_active';
        RAISE NOTICE '==========================';
    END IF;
END $$;

-- Step 3: Drop unnecessary columns
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) THEN
        -- Drop is_host column
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'is_host'
        ) THEN
            ALTER TABLE users DROP COLUMN IF EXISTS is_host;
            RAISE NOTICE '✓ Dropped column: is_host';
        END IF;

        -- Drop current_room_id column
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'current_room_id'
        ) THEN
            ALTER TABLE users DROP COLUMN IF EXISTS current_room_id;
            RAISE NOTICE '✓ Dropped column: current_room_id';
        END IF;

        -- Drop quiz_progress column
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'quiz_progress'
        ) THEN
            ALTER TABLE users DROP COLUMN IF EXISTS quiz_progress;
            RAISE NOTICE '✓ Dropped column: quiz_progress';
        END IF;

        -- Drop memory_return_data column
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'memory_return_data'
        ) THEN
            ALTER TABLE users DROP COLUMN IF EXISTS memory_return_data;
            RAISE NOTICE '✓ Dropped column: memory_return_data';
        END IF;

        -- Drop questions_answered column
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'questions_answered'
        ) THEN
            ALTER TABLE users DROP COLUMN IF EXISTS questions_answered;
            RAISE NOTICE '✓ Dropped column: questions_answered';
        END IF;

        -- Drop memory_cards_found column
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'memory_cards_found'
        ) THEN
            ALTER TABLE users DROP COLUMN IF EXISTS memory_cards_found;
            RAISE NOTICE '✓ Dropped column: memory_cards_found';
        END IF;

        -- Drop total_score column
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'total_score'
        ) THEN
            ALTER TABLE users DROP COLUMN IF EXISTS total_score;
            RAISE NOTICE '✓ Dropped column: total_score';
        END IF;

        -- Drop completed_at column
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'completed_at'
        ) THEN
            ALTER TABLE users DROP COLUMN IF EXISTS completed_at;
            RAISE NOTICE '✓ Dropped column: completed_at';
        END IF;

        RAISE NOTICE '';
        RAISE NOTICE '✅ All unnecessary columns dropped successfully!';
    ELSE
        RAISE NOTICE 'users table does not exist in public schema';
    END IF;
END $$;

-- Step 4: Verifikasi struktur tabel users setelah cleanup
DO $$
DECLARE
    column_list TEXT;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) THEN
        SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
        INTO column_list
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'users';
        
        RAISE NOTICE '';
        RAISE NOTICE '=== USERS TABLE STRUCTURE ===';
        RAISE NOTICE 'Remaining columns: %', column_list;
        RAISE NOTICE '============================';
    END IF;
END $$;

-- Step 5: Tampilkan detail struktur lengkap
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- =========================================
-- SUMMARY
-- =========================================
-- 
-- Operasi yang dilakukan:
-- 1. ✅ Backup game data ke users_game_data_backup
-- 2. ✅ Hapus 8 kolom yang tidak diperlukan:
--    - is_host
--    - current_room_id  
--    - quiz_progress
--    - memory_return_data
--    - questions_answered
--    - memory_cards_found
--    - total_score
--    - completed_at
-- 3. ✅ Pertahankan kolom profil penting:
--    - id, username, avatar_url, email
--    - created_at, updated_at, joined_at, is_active
-- 
-- Manfaat:
-- - Struktur tabel lebih bersih
-- - Tidak ada duplikasi data dengan tabel players
-- - Lebih mudah maintenance
-- - Database lebih optimal
-- 
-- Next steps:
-- 1. Pastikan aplikasi menggunakan tabel players untuk game data
-- 2. Hapus backup table jika tidak diperlukan lagi:
--    DROP TABLE users_game_data_backup;
-- 
-- =========================================

