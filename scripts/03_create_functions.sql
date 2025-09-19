-- Create utility functions for game management

-- Function to generate unique room codes
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    code VARCHAR(6);
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 6-character alphanumeric code
        code := UPPER(
            SUBSTRING(
                MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) 
                FROM 1 FOR 6
            )
        );
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM rooms WHERE room_code = code) INTO exists;
        
        -- Exit loop if code is unique
        IF NOT exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old rooms (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_rooms()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rooms 
    WHERE created_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update player last active timestamp
CREATE OR REPLACE FUNCTION update_player_activity(player_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE players 
    SET last_active = NOW() 
    WHERE id = player_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get room statistics
CREATE OR REPLACE FUNCTION get_room_stats(room_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_players', COUNT(*),
        'memory_completed', COUNT(*) FILTER (WHERE memory_game_completed = true),
        'average_quiz_score', COALESCE(AVG(quiz_score), 0),
        'average_memory_score', COALESCE(AVG(memory_game_score), 0)
    )
    INTO result
    FROM players 
    WHERE room_id = room_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
