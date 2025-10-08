-- Migration script untuk mengganti localStorage dengan Supabase (SAFE VERSION)
-- Menambahkan fields dan tabel yang diperlukan tanpa operasi destruktif

-- 1. Update tabel players untuk game progress yang lebih detail
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS game_progress JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS memory_game_progress JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS current_question INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS correct_answers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Update tabel rooms untuk game state yang lebih detail
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS game_state JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS memory_game_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS memory_game_players JSONB DEFAULT '[]';

-- 3. Buat tabel untuk failed updates (retry mechanism)
CREATE TABLE IF NOT EXISTS failed_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_code VARCHAR(10) NOT NULL,
    player_id UUID NOT NULL,
    update_type VARCHAR(50) NOT NULL, -- 'score', 'progress', 'status'
    update_data JSONB NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' -- 'pending', 'processing', 'completed', 'failed'
);

-- 4. Buat tabel untuk game sessions (mengganti localStorage sessions)
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('host', 'player')),
    user_data JSONB NOT NULL,
    room_code VARCHAR(10),
    device_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    is_active BOOLEAN DEFAULT TRUE
);

-- 5. Buat indexes untuk performance
CREATE INDEX IF NOT EXISTS idx_failed_updates_room_player ON failed_updates(room_code, player_id);
CREATE INDEX IF NOT EXISTS idx_failed_updates_status ON failed_updates(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_session_id ON game_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_room_code ON game_sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_game_sessions_expires ON game_sessions(expires_at);

-- 6. Buat function untuk cleanup expired sessions (tanpa DELETE)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    -- Hanya update status, tidak delete
    UPDATE game_sessions 
    SET is_active = FALSE
    WHERE expires_at < NOW() AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- 7. Buat function untuk retry failed updates
CREATE OR REPLACE FUNCTION retry_failed_updates()
RETURNS void AS $$
BEGIN
    -- Update status dari pending ke processing
    UPDATE failed_updates 
    SET status = 'processing', last_attempt = NOW()
    WHERE status = 'pending' 
    AND attempts < max_attempts
    AND last_attempt < NOW() - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql;

-- 8. Buat trigger untuk auto cleanup sessions
CREATE OR REPLACE FUNCTION trigger_cleanup_sessions()
RETURNS trigger AS $$
BEGIN
    -- Cleanup expired sessions setiap ada insert/update
    PERFORM cleanup_expired_sessions();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cleanup_sessions ON game_sessions;
CREATE TRIGGER trigger_cleanup_sessions
    AFTER INSERT OR UPDATE ON game_sessions
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_cleanup_sessions();

-- 9. Enable RLS untuk tabel baru
ALTER TABLE failed_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- 10. Buat policies untuk RLS
CREATE POLICY "Users can view their own failed updates" ON failed_updates
    FOR SELECT USING (true); -- Untuk sekarang allow all, bisa di-restrict nanti

CREATE POLICY "Users can insert their own failed updates" ON failed_updates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own failed updates" ON failed_updates
    FOR UPDATE USING (true);

CREATE POLICY "Users can view their own game sessions" ON game_sessions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own game sessions" ON game_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own game sessions" ON game_sessions
    FOR UPDATE USING (true);

-- 11. Update existing data structure (SAFE - hanya untuk records yang kosong)
-- Migrate existing quiz_score dan memory_game_score ke JSONB format
UPDATE players 
SET game_progress = jsonb_build_object(
    'quiz_score', COALESCE(quiz_score, 0),
    'memory_score', COALESCE(memory_game_score, 0),
    'questions_answered', COALESCE(questions_answered, 0),
    'current_question', 0,
    'correct_answers', 0,
    'last_updated', NOW()
)
WHERE (game_progress = '{}' OR game_progress IS NULL)
AND (quiz_score IS NOT NULL OR memory_game_score IS NOT NULL OR questions_answered IS NOT NULL);

-- 12. Update rooms dengan default game state (SAFE - hanya untuk records yang kosong)
UPDATE rooms 
SET game_state = jsonb_build_object(
    'status', status,
    'memory_game_active', false,
    'memory_game_players', '[]',
    'last_updated', NOW()
)
WHERE (game_state = '{}' OR game_state IS NULL)
AND status IS NOT NULL;
