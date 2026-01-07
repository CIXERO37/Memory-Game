-- ============================================================
-- Migration: Add ended_at column to sessions table (Supabase B)
-- Date: 2026-01-06
-- Purpose: Track when game sessions end
-- ============================================================

-- Add ended_at column to sessions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sessions' 
        AND column_name = 'ended_at'
    ) THEN
        ALTER TABLE sessions ADD COLUMN ended_at TIMESTAMPTZ DEFAULT NULL;
        RAISE NOTICE '✅ Column ended_at added to sessions table';
    ELSE
        RAISE NOTICE '⚠️ Column ended_at already exists in sessions table';
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN sessions.ended_at IS 'Timestamp when the game session ended (status = finished)';

-- Create index for faster queries on ended_at (useful for analytics and cleanup)
CREATE INDEX IF NOT EXISTS idx_sessions_ended_at ON sessions(ended_at);

-- Verification query
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sessions' 
AND column_name IN ('started_at', 'ended_at', 'countdown_started_at')
ORDER BY column_name;

-- ============================================================
-- INSTRUCTIONS:
-- 1. Run this script on your Supabase B database (Players DB)
-- 2. Go to Supabase Dashboard > SQL Editor
-- 3. Paste and run this script
-- ============================================================
