-- Migration script to change difficulty field to category field
-- This script updates the quizzes table to use category instead of difficulty

-- First, add the new category column
ALTER TABLE quizzes ADD COLUMN category VARCHAR(50);

-- Update existing quizzes with appropriate categories based on their titles/descriptions
-- This is a mapping from the current quiz data structure
UPDATE quizzes SET category = 'Mathematics' WHERE title ILIKE '%math%' OR title ILIKE '%mathematics%';
UPDATE quizzes SET category = 'Science' WHERE title ILIKE '%science%' OR title ILIKE '%physics%' OR title ILIKE '%nature%';
UPDATE quizzes SET category = 'Geography' WHERE title ILIKE '%geography%' OR title ILIKE '%world%';
UPDATE quizzes SET category = 'Language' WHERE title ILIKE '%english%' OR title ILIKE '%vocabulary%' OR title ILIKE '%language%';
UPDATE quizzes SET category = 'History' WHERE title ILIKE '%history%' OR title ILIKE '%historical%';
UPDATE quizzes SET category = 'Entertainment' WHERE title ILIKE '%art%' OR title ILIKE '%culture%' OR title ILIKE '%music%';
UPDATE quizzes SET category = 'Technology' WHERE title ILIKE '%programming%' OR title ILIKE '%technology%' OR title ILIKE '%computer%';
UPDATE quizzes SET category = 'Sports' WHERE title ILIKE '%sport%' OR title ILIKE '%fitness%' OR title ILIKE '%exercise%';
UPDATE quizzes SET category = 'Business' WHERE title ILIKE '%business%' OR title ILIKE '%finance%' OR title ILIKE '%economics%';

-- Set default category for any remaining quizzes
UPDATE quizzes SET category = 'General' WHERE category IS NULL;

-- Make category column NOT NULL
ALTER TABLE quizzes ALTER COLUMN category SET NOT NULL;

-- Add check constraint for valid categories
ALTER TABLE quizzes ADD CONSTRAINT check_category 
CHECK (category IN ('General', 'Science', 'Mathematics', 'History', 'Geography', 'Language', 'Technology', 'Sports', 'Entertainment', 'Business'));

-- Create index for category field
CREATE INDEX IF NOT EXISTS idx_quizzes_category ON quizzes(category);

-- Drop the old difficulty column and its index
DROP INDEX IF EXISTS idx_quizzes_difficulty;
ALTER TABLE quizzes DROP COLUMN difficulty;

-- Update comments
COMMENT ON COLUMN quizzes.category IS 'Category of the quiz: General, Science, Mathematics, History, Geography, Language, Technology, Sports, Entertainment, or Business';
