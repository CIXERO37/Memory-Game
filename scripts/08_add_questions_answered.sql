-- Add questions_answered column to players table
ALTER TABLE players 
ADD COLUMN questions_answered INTEGER DEFAULT 0;

-- Update existing players to have 0 questions answered
UPDATE players 
SET questions_answered = 0 
WHERE questions_answered IS NULL;
