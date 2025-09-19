-- Insert sample data for testing

-- Insert sample rooms for testing
INSERT INTO rooms (room_code, host_name, quiz_id, quiz_title, time_limit, question_count, status) VALUES
('TEST01', 'Host Player', 'math-basics', 'Mathematics Basics', 30, 10, 'waiting'),
('TEST02', 'Quiz Master', 'science-fun', 'Science Fun Facts', 45, 15, 'waiting'),
('DEMO01', 'Demo Host', 'geography', 'World Geography', 60, 20, 'waiting');

-- Insert sample players for testing
INSERT INTO players (room_id, username, avatar, is_host, memory_game_completed) VALUES
((SELECT id FROM rooms WHERE room_code = 'TEST01'), 'Host Player', '👨‍🏫', true, false),
((SELECT id FROM rooms WHERE room_code = 'TEST01'), 'Student1', '🧑‍🎓', false, false),
((SELECT id FROM rooms WHERE room_code = 'TEST01'), 'Student2', '👩‍🎓', false, false),
((SELECT id FROM rooms WHERE room_code = 'TEST02'), 'Quiz Master', '🎯', true, false),
((SELECT id FROM rooms WHERE room_code = 'TEST02'), 'Player1', '🚀', false, false);

-- Insert sample game states
INSERT INTO game_states (room_id, state_type, state_data) VALUES
((SELECT id FROM rooms WHERE room_code = 'TEST01'), 'waiting', '{"message": "Waiting for players to join"}'),
((SELECT id FROM rooms WHERE room_code = 'TEST02'), 'waiting', '{"message": "Waiting for players to join"}');
