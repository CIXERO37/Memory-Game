-- Create user sessions table for storing user data instead of localStorage

-- User sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- 'host' or 'player'
    user_data JSONB NOT NULL, -- stores user information
    room_code VARCHAR(6), -- associated room code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Create indexes for better performance
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_room_code ON user_sessions(room_code);
CREATE INDEX idx_user_sessions_user_type ON user_sessions(user_type);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically clean up expired sessions
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_sessions()
RETURNS trigger AS $$
BEGIN
    PERFORM cleanup_expired_sessions();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs cleanup on any insert
CREATE TRIGGER cleanup_expired_sessions_trigger
    AFTER INSERT ON user_sessions
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_cleanup_expired_sessions();

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user sessions
CREATE POLICY "Users can access their own sessions" ON user_sessions
    FOR ALL USING (session_id = current_setting('app.current_session_id', true));

-- Create function to get or create session
CREATE OR REPLACE FUNCTION get_or_create_session(
    p_session_id VARCHAR(255),
    p_user_type VARCHAR(20),
    p_user_data JSONB,
    p_room_code VARCHAR(6) DEFAULT NULL
)
RETURNS user_sessions AS $$
DECLARE
    result user_sessions;
BEGIN
    -- Try to get existing session
    SELECT * INTO result FROM user_sessions 
    WHERE session_id = p_session_id;
    
    IF FOUND THEN
        -- Update existing session
        UPDATE user_sessions 
        SET 
            user_data = p_user_data,
            room_code = p_room_code,
            last_active = NOW(),
            expires_at = NOW() + INTERVAL '24 hours'
        WHERE session_id = p_session_id
        RETURNING * INTO result;
    ELSE
        -- Create new session
        INSERT INTO user_sessions (session_id, user_type, user_data, room_code)
        VALUES (p_session_id, p_user_type, p_user_data, p_room_code)
        RETURNING * INTO result;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to get session data
CREATE OR REPLACE FUNCTION get_session_data(p_session_id VARCHAR(255))
RETURNS user_sessions AS $$
DECLARE
    result user_sessions;
BEGIN
    SELECT * INTO result FROM user_sessions 
    WHERE session_id = p_session_id AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found or expired';
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to delete session
CREATE OR REPLACE FUNCTION delete_session(p_session_id VARCHAR(255))
RETURNS boolean AS $$
BEGIN
    DELETE FROM user_sessions WHERE session_id = p_session_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
