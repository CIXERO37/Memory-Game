    -- =====================================================
    -- CLEANUP SCRIPT: Remove Unused Tables
    -- =====================================================
    -- 
    -- PERINGATAN: Script ini akan MENGHAPUS tabel dan semua data di dalamnya!
    -- Pastikan untuk BACKUP database terlebih dahulu sebelum menjalankan script ini.
    --
    -- Tabel yang akan dihapus:
    -- 1. game_states - Tidak digunakan dalam kode aplikasi
    -- 2. player_answers - Tidak digunakan dalam kode aplikasi  
    -- 3. memory_game_results - Tidak digunakan dalam kode aplikasi
    -- 4. user_sessions - Tidak digunakan dalam kode aplikasi
    -- 5. kicked_players - Tidak digunakan dalam kode aplikasi (jika ada)
    --
    -- Tanggal: $(date)
    -- =====================================================

    -- Cek apakah tabel masih memiliki data sebelum dihapus
    DO $$
    DECLARE
        game_states_count INTEGER;
        player_answers_count INTEGER;
        memory_results_count INTEGER;
        user_sessions_count INTEGER;
        kicked_players_count INTEGER;
    BEGIN
        -- Cek jumlah data di setiap tabel
        SELECT COUNT(*) INTO game_states_count FROM game_states;
        SELECT COUNT(*) INTO player_answers_count FROM player_answers;
        SELECT COUNT(*) INTO memory_results_count FROM memory_game_results;
        
        -- Cek user_sessions jika ada
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
            SELECT COUNT(*) INTO user_sessions_count FROM user_sessions;
        ELSE
            user_sessions_count := 0;
        END IF;
        
        -- Cek kicked_players jika ada
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kicked_players') THEN
            SELECT COUNT(*) INTO kicked_players_count FROM kicked_players;
        ELSE
            kicked_players_count := 0;
        END IF;
        
        -- Tampilkan informasi data yang akan dihapus
        RAISE NOTICE '=== DATA YANG AKAN DIHAPUS ===';
        RAISE NOTICE 'game_states: % records', game_states_count;
        RAISE NOTICE 'player_answers: % records', player_answers_count;
        RAISE NOTICE 'memory_game_results: % records', memory_results_count;
        RAISE NOTICE 'user_sessions: % records', user_sessions_count;
        RAISE NOTICE 'kicked_players: % records', kicked_players_count;
        RAISE NOTICE '================================';
    END $$;

    -- =====================================================
    -- STEP 1: Drop Foreign Key Constraints (jika ada)
    -- =====================================================

    -- Drop constraints yang mungkin mengacu ke tabel yang akan dihapus
    -- (Biasanya sudah CASCADE, tapi untuk safety)

    -- =====================================================
    -- STEP 2: Drop Indexes
    -- =====================================================

    -- Drop indexes untuk game_states
    DROP INDEX IF EXISTS idx_game_states_room_id;

    -- Drop indexes untuk player_answers  
    DROP INDEX IF EXISTS idx_player_answers_room_player;

    -- Drop indexes untuk memory_game_results
    DROP INDEX IF EXISTS idx_memory_results_room_player;

    -- Drop indexes untuk user_sessions (jika ada)
    DROP INDEX IF EXISTS idx_user_sessions_session_id;
    DROP INDEX IF EXISTS idx_user_sessions_room_code;
    DROP INDEX IF EXISTS idx_user_sessions_user_type;
    DROP INDEX IF EXISTS idx_user_sessions_expires_at;

    DO $$ BEGIN
        RAISE NOTICE 'Indexes dropped successfully';
    END $$;

    -- =====================================================
    -- STEP 3: Drop Functions (jika ada)
    -- =====================================================

    -- Drop functions yang terkait dengan user_sessions
    DROP FUNCTION IF EXISTS create_or_get_session(VARCHAR, VARCHAR, JSONB, VARCHAR);
    DROP FUNCTION IF EXISTS get_session_data(VARCHAR);
    DROP FUNCTION IF EXISTS cleanup_expired_sessions();

    DO $$ BEGIN
        RAISE NOTICE 'Functions dropped successfully';
    END $$;

    -- =====================================================
    -- STEP 4: Drop Triggers (jika ada)
    -- =====================================================

    -- Drop trigger untuk cleanup expired sessions
    DROP TRIGGER IF EXISTS trigger_cleanup_expired_sessions ON user_sessions;

    DO $$ BEGIN
        RAISE NOTICE 'Triggers dropped successfully';
    END $$;

    -- =====================================================
    -- STEP 5: Drop Tables
    -- =====================================================

    -- Drop tabel game_states
    DROP TABLE IF EXISTS game_states CASCADE;

    -- Drop tabel player_answers
    DROP TABLE IF EXISTS player_answers CASCADE;

    -- Drop tabel memory_game_results
    DROP TABLE IF EXISTS memory_game_results CASCADE;

    -- Drop tabel user_sessions
    DROP TABLE IF EXISTS user_sessions CASCADE;

    -- Drop tabel kicked_players (jika ada)
    DROP TABLE IF EXISTS kicked_players CASCADE;

    DO $$ BEGIN
        RAISE NOTICE 'All unused tables dropped successfully';
        RAISE NOTICE 'Dropped: game_states, player_answers, memory_game_results, user_sessions, kicked_players';
    END $$;

    -- =====================================================
    -- STEP 6: Cleanup RLS Policies (otomatis terhapus dengan CASCADE)
    -- =====================================================

    -- RLS policies akan otomatis terhapus ketika tabel dihapus
9
    -- =====================================================
    -- VERIFICATION: Cek tabel yang tersisa
    -- =====================================================

DO $$
DECLARE
    remaining_tables TEXT;
BEGIN
    SELECT string_agg(table_name, ', ' ORDER BY table_name) INTO remaining_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE '=== TABEL YANG TERSISA ===';
    RAISE NOTICE 'Tables: %', COALESCE(remaining_tables, 'No tables found');
    RAISE NOTICE '========================';
END $$;

    -- =====================================================
    -- FINAL MESSAGE
    -- =====================================================

    DO $$
    BEGIN
        RAISE NOTICE '=== CLEANUP COMPLETED ===';
        RAISE NOTICE 'Unused tables have been successfully removed!';
        RAISE NOTICE 'Remaining active tables:';
        RAISE NOTICE '- rooms (active)';
        RAISE NOTICE '- players (active)';
        RAISE NOTICE '- quizzes (active)';
        RAISE NOTICE '- game_sessions (active)';
        RAISE NOTICE '- failed_updates (active)';
        RAISE NOTICE '========================';
    END $$;
