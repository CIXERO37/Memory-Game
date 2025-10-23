-- Optimize Database Structure
-- Menggabungkan tabel untuk membuat database lebih ringkas
-- From 7 tables → 5 tables

-- =========================================
-- PART 1: Gabung game_sessions ke rooms
-- =========================================

-- Step 1: Backup data game_sessions (optional, for safety)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_sessions') THEN
    CREATE TABLE IF NOT EXISTS game_sessions_backup AS 
    SELECT * FROM game_sessions;
    RAISE NOTICE 'game_sessions backed up to game_sessions_backup';
  ELSE
    RAISE NOTICE 'game_sessions table does not exist, skipping backup';
  END IF;
END $$;

-- Step 2: Tambah kolom session ke tabel rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS session_id VARCHAR(255);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_session_active BOOLEAN DEFAULT true;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS session_last_active TIMESTAMP WITH TIME ZONE;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS session_data JSONB;

-- Step 3: Migrate data dari game_sessions ke rooms (if game_sessions exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_sessions') THEN
    -- Migrate data dari game_sessions ke rooms
    UPDATE rooms r
    SET 
      session_id = gs.session_id,
      is_session_active = gs.is_active,
      session_last_active = gs.last_active,
      session_data = jsonb_build_object(
        'session_id', gs.session_id,
        'user_type', gs.user_type,
        'user_data', gs.user_data,
        'room_code', gs.room_code,
        'device_info', gs.device_info,
        'created_at', gs.created_at,
        'expires_at', gs.expires_at
      )
    FROM game_sessions gs 
    WHERE r.room_code = gs.room_code;
    
    RAISE NOTICE 'Data migrated from game_sessions to rooms';
  ELSE
    RAISE NOTICE 'game_sessions table does not exist, skipping migration';
  END IF;
END $$;

-- Step 4: Create index untuk performance
CREATE INDEX IF NOT EXISTS idx_rooms_session_id ON rooms(session_id);
CREATE INDEX IF NOT EXISTS idx_rooms_is_session_active ON rooms(is_session_active);

-- Step 5: Drop tabel game_sessions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_sessions') THEN
    DROP TABLE game_sessions CASCADE;
    RAISE NOTICE 'game_sessions table dropped';
  ELSE
    RAISE NOTICE 'game_sessions table does not exist, nothing to drop';
  END IF;
END $$;

-- =========================================
-- PART 2: Hapus tabel failed_updates
-- =========================================

-- Step 1: Backup data failed_updates (optional, for safety)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'failed_updates') THEN
    CREATE TABLE IF NOT EXISTS failed_updates_backup AS 
    SELECT * FROM failed_updates;
    RAISE NOTICE 'failed_updates backed up to failed_updates_backup';
  ELSE
    RAISE NOTICE 'failed_updates table does not exist, skipping backup';
  END IF;
END $$;

-- Step 2: Drop tabel failed_updates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'failed_updates') THEN
    DROP TABLE failed_updates CASCADE;
    RAISE NOTICE 'failed_updates table dropped';
  ELSE
    RAISE NOTICE 'failed_updates table does not exist, nothing to drop';
  END IF;
END $$;

-- =========================================
-- PART 3: Verifikasi struktur database
-- =========================================

-- List semua tabel yang ada
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Count rows di tabel utama
SELECT 
  'users' as table_name, COUNT(*) as row_count FROM auth.users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'rooms', COUNT(*) FROM rooms
UNION ALL
SELECT 'players', COUNT(*) FROM players
UNION ALL
SELECT 'quizzes', COUNT(*) FROM quizzes;

-- =========================================
-- PART 4: Update RLS policies untuk rooms
-- =========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON rooms;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON rooms;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON rooms;

-- Create new comprehensive policies
CREATE POLICY "Anyone can view rooms"
    ON rooms
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create rooms"
    ON rooms
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update rooms"
    ON rooms
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do anything on rooms"
    ON rooms
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- =========================================
-- PART 5: Create helper functions
-- =========================================

-- Function to update session last active
CREATE OR REPLACE FUNCTION update_room_session_last_active(room_code_param VARCHAR)
RETURNS void AS $$
BEGIN
    UPDATE rooms
    SET session_last_active = NOW()
    WHERE room_code = room_code_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active sessions
CREATE OR REPLACE FUNCTION get_active_room_sessions()
RETURNS TABLE(
    room_code VARCHAR,
    session_id VARCHAR,
    is_active BOOLEAN,
    last_active TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.room_code,
        r.session_id,
        r.is_session_active,
        r.session_last_active
    FROM rooms r
    WHERE r.is_session_active = true
    ORDER BY r.session_last_active DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================
-- PART 6: Grant permissions
-- =========================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- =========================================
-- PART 7: Verification queries
-- =========================================

-- Verify rooms table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'rooms'
ORDER BY ordinal_position;

-- Check if old tables are dropped
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_sessions')
        THEN '❌ game_sessions still exists'
        ELSE '✅ game_sessions dropped'
    END as game_sessions_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'failed_updates')
        THEN '❌ failed_updates still exists'
        ELSE '✅ failed_updates dropped'
    END as failed_updates_status;

-- =========================================
-- SUMMARY
-- =========================================

-- Before: 7 tables (users, profiles, rooms, players, quizzes, game_sessions, failed_updates)
-- After: 5 tables (users, profiles, rooms, players, quizzes)
-- Optimization: -2 tables (28% reduction)

-- Changes:
-- 1. ✅ game_sessions → Merged into rooms
-- 2. ✅ failed_updates → Dropped (error handling moved to code)
-- 3. ✅ Added session columns to rooms
-- 4. ✅ Created helper functions for session management
-- 5. ✅ Updated RLS policies
-- 6. ✅ Created indexes for performance

-- Next steps:
-- 1. Update lib/supabase-session-manager.ts to query rooms instead of game_sessions
-- 2. Remove lib/failed-updates-manager.ts or update to use different error handling
-- 3. Test all functionality to ensure nothing is broken

