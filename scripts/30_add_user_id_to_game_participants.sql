-- ============================================================
-- Migration: Add user_id column to game_participants table (Supabase B)
-- Date: 2026-01-06
-- Purpose: Store user_id from profiles table for each participant
-- ============================================================

-- Add user_id column to game_participants table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'game_participants' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE game_participants ADD COLUMN user_id TEXT DEFAULT NULL;
        RAISE NOTICE '✅ Column user_id added to game_participants table';
    ELSE
        RAISE NOTICE '⚠️ Column user_id already exists in game_participants table';
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN game_participants.user_id IS 'User ID from profiles table (for logged-in users, NULL for guests)';

-- Create index for faster queries on user_id (useful for user history)
CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON game_participants(user_id);

-- Verification query
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'game_participants' 
AND column_name IN ('id', 'user_id', 'nickname', 'game_pin')
ORDER BY column_name;

-- ============================================================
-- INSTRUCTIONS:
-- 1. Run this script on your Supabase B database (Players DB)
-- 2. Go to Supabase Dashboard > SQL Editor
-- 3. Paste and run this script
-- ============================================================
