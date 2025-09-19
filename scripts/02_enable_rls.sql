-- Enable Row Level Security for all tables

-- Enable RLS on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_game_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms
CREATE POLICY "Anyone can read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create rooms" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Host can update their room" ON rooms FOR UPDATE USING (true);
CREATE POLICY "Host can delete their room" ON rooms FOR DELETE USING (true);

-- RLS Policies for players
CREATE POLICY "Anyone can read players" ON players FOR SELECT USING (true);
CREATE POLICY "Anyone can join as player" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Players can update themselves" ON players FOR UPDATE USING (true);
CREATE POLICY "Players can leave room" ON players FOR DELETE USING (true);

-- RLS Policies for game_states
CREATE POLICY "Anyone can read game states" ON game_states FOR SELECT USING (true);
CREATE POLICY "Anyone can create game states" ON game_states FOR INSERT WITH CHECK (true);

-- RLS Policies for player_answers
CREATE POLICY "Anyone can read answers" ON player_answers FOR SELECT USING (true);
CREATE POLICY "Players can submit answers" ON player_answers FOR INSERT WITH CHECK (true);

-- RLS Policies for memory_game_results
CREATE POLICY "Anyone can read memory results" ON memory_game_results FOR SELECT USING (true);
CREATE POLICY "Players can submit memory results" ON memory_game_results FOR INSERT WITH CHECK (true);
