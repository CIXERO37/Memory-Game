-- Script untuk update data existing (JALANKAN SETELAH script utama)
-- WARNING: Script ini mengandung UPDATE operations yang bisa mengubah data existing

-- 1. Update existing players data ke JSONB format
-- Hanya update records yang belum memiliki game_progress
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

-- 2. Update existing rooms data ke JSONB format
-- Hanya update records yang belum memiliki game_state
UPDATE rooms 
SET game_state = jsonb_build_object(
    'status', status,
    'memory_game_active', false,
    'memory_game_players', '[]',
    'last_updated', NOW()
)
WHERE (game_state = '{}' OR game_state IS NULL)
AND status IS NOT NULL;

-- 3. Optional: Cleanup old sessions (HATI-HATI!)
-- Uncomment baris di bawah jika ingin menghapus sessions yang sudah expired
-- DELETE FROM game_sessions WHERE expires_at < NOW() - INTERVAL '7 days';
