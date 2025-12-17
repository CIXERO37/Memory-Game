-- =====================================================
-- SUPABASE B (Players/Realtime Database) SETUP SCRIPT
-- =====================================================
-- Status: waiting, active, finished
-- Auto-delete sessions & participants after 24 hours
-- =====================================================

-- Function to generate XID-like IDs
CREATE OR REPLACE FUNCTION generate_xid() RETURNS TEXT AS $$
DECLARE
    chars TEXT := '0123456789abcdefghijklmnopqrstuv';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..20 LOOP
        result := result || substr(chars, floor(random() * 32)::int + 1, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Drop existing objects first for clean setup
DROP VIEW IF EXISTS old_sessions CASCADE;
DROP VIEW IF EXISTS old_participants CASCADE;
DROP TABLE IF EXISTS game_participants CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- =====================================================
-- TABLE 1: sessions
-- =====================================================
CREATE TABLE sessions (
    id TEXT PRIMARY KEY DEFAULT generate_xid(),
    game_pin TEXT NOT NULL UNIQUE,
    host_id TEXT NOT NULL,
    quiz_id TEXT,
    quiz_title TEXT,
    status TEXT NOT NULL DEFAULT 'waiting',
    time_limit_minutes INTEGER DEFAULT 5,
    settings JSONB DEFAULT '{"questionCount": 10, "totalTimeLimit": 300}',
    questions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    countdown_started_at TIMESTAMPTZ,
    countdown_duration_seconds INTEGER DEFAULT 10,
    CONSTRAINT valid_status CHECK (status IN ('waiting', 'active', 'finished'))
);

-- Indexes
CREATE INDEX idx_sessions_game_pin ON sessions(game_pin);
CREATE INDEX idx_sessions_host_id ON sessions(host_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;

-- =====================================================
-- TABLE 2: game_participants
-- =====================================================
CREATE TABLE game_participants (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    game_pin TEXT NOT NULL,
    nickname TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    is_host BOOLEAN DEFAULT FALSE,
    score INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    started TIMESTAMPTZ,
    ended TIMESTAMPTZ,
    
    -- NEW: answers field untuk menyimpan jawaban quiz
    -- Format: [{ question_id, answer_id, is_correct, points_earned, created_at }]
    answers JSONB DEFAULT '[]',
    
    UNIQUE(game_pin, nickname)
);

-- Indexes
CREATE INDEX idx_participants_session_id ON game_participants(session_id);
CREATE INDEX idx_participants_game_pin ON game_participants(game_pin);
CREATE INDEX idx_participants_joined_at ON game_participants(joined_at);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE game_participants;

-- =====================================================
-- RLS Policies
-- =====================================================
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all game_participants" ON game_participants FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- AUTO-DELETE: Cleanup function for both tables
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
DECLARE
    sessions_deleted INTEGER;
    participants_deleted INTEGER;
BEGIN
    DELETE FROM game_participants
    WHERE joined_at < NOW() - INTERVAL '24 hours';
    GET DIAGNOSTICS participants_deleted = ROW_COUNT;
    
    DELETE FROM sessions
    WHERE created_at < NOW() - INTERVAL '24 hours';
    GET DIAGNOSTICS sessions_deleted = ROW_COUNT;
    
    RAISE NOTICE 'Cleanup: % sessions, % participants deleted', 
                 sessions_deleted, participants_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SCHEDULED JOB (after enabling pg_cron):
-- SELECT cron.schedule('cleanup-old-data', '0 * * * *', 'SELECT cleanup_old_data();');
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Supabase B setup complete!';
    RAISE NOTICE '   - sessions: game session data';
    RAISE NOTICE '   - game_participants: player data with answers';
    RAISE NOTICE '   - Auto-delete after 24 hours';
END $$;
