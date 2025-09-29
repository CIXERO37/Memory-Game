-- Add countdown fields to rooms table
ALTER TABLE rooms 
ADD COLUMN countdown_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN countdown_duration INTEGER DEFAULT 10;

-- Update the status enum to include countdown
-- Note: PostgreSQL doesn't have ENUMs in this schema, so we just update the comment
COMMENT ON COLUMN rooms.status IS 'waiting, countdown, quiz, memory, finished';
