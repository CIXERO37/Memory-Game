-- Creating core database schema for memory quiz game platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable realtime for all tables
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- Rooms table for game sessions
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(6) UNIQUE NOT NULL,
    host_name VARCHAR(50) NOT NULL,
    quiz_id VARCHAR(50) NOT NULL,
    quiz_title VARCHAR(100) NOT NULL,
    time_limit INTEGER DEFAULT 30,
    question_count INTEGER DEFAULT 10,
    status VARCHAR(20) DEFAULT 'waiting', -- waiting, countdown, memory_challenge, quiz, finished
    current_question INTEGER DEFAULT 0,
    countdown_start_time TIMESTAMP WITH TIME ZONE,
    countdown_duration INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE
);

-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    avatar VARCHAR(100) NOT NULL,
    is_host BOOLEAN DEFAULT FALSE,
    memory_game_completed BOOLEAN DEFAULT FALSE,
    memory_game_score INTEGER DEFAULT 0,
    quiz_score INTEGER DEFAULT 0,
    current_answer VARCHAR(10),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game states for real-time synchronization
CREATE TABLE game_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    state_type VARCHAR(50) NOT NULL, -- countdown, memory_challenge, quiz_question, results
    state_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player answers for tracking responses
CREATE TABLE player_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    selected_answer VARCHAR(10) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memory game results
CREATE TABLE memory_game_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    matches_found INTEGER NOT NULL,
    time_taken INTEGER NOT NULL, -- in seconds
    completed BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_rooms_room_code ON rooms(room_code);
CREATE INDEX idx_players_room_id ON players(room_id);
CREATE INDEX idx_game_states_room_id ON game_states(room_id);
CREATE INDEX idx_player_answers_room_player ON player_answers(room_id, player_id);
CREATE INDEX idx_memory_results_room_player ON memory_game_results(room_id, player_id);
