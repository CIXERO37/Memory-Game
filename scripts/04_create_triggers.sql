-- Create triggers for automatic room code generation and cleanup

-- Trigger to automatically generate room code when creating a room
CREATE OR REPLACE FUNCTION set_room_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.room_code IS NULL OR NEW.room_code = '' THEN
        NEW.room_code := generate_room_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_room_code
    BEFORE INSERT ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION set_room_code();

-- Trigger to update last_active timestamp when player data changes
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_active := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_active
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_last_active();

-- Trigger to automatically update room status based on game progress
CREATE OR REPLACE FUNCTION update_room_status()
RETURNS TRIGGER AS $$
DECLARE
    total_players INTEGER;
    completed_memory INTEGER;
BEGIN
    -- Get player counts
    SELECT COUNT(*) INTO total_players
    FROM players WHERE room_id = NEW.room_id;
    
    SELECT COUNT(*) INTO completed_memory
    FROM players WHERE room_id = NEW.room_id AND memory_game_completed = true;
    
    -- Update room status if all players completed memory game
    IF completed_memory = total_players AND total_players > 0 THEN
        UPDATE rooms 
        SET status = 'quiz' 
        WHERE id = NEW.room_id AND status = 'memory_challenge';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_room_status
    AFTER UPDATE ON players
    FOR EACH ROW
    WHEN (OLD.memory_game_completed IS DISTINCT FROM NEW.memory_game_completed)
    EXECUTE FUNCTION update_room_status();
