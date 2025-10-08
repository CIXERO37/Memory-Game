-- Creating quizzes table for the memory quiz game platform
-- This table will store all quiz data including questions and metadata

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quizzes_difficulty ON quizzes(difficulty);
CREATE INDEX IF NOT EXISTS idx_quizzes_title ON quizzes(title);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to quizzes
CREATE POLICY "Allow public read access to quizzes" ON quizzes
    FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert quizzes (for admin purposes)
CREATE POLICY "Allow authenticated users to insert quizzes" ON quizzes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update quizzes (for admin purposes)
CREATE POLICY "Allow authenticated users to update quizzes" ON quizzes
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete quizzes (for admin purposes)
CREATE POLICY "Allow authenticated users to delete quizzes" ON quizzes
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_quizzes_updated_at 
    BEFORE UPDATE ON quizzes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE quizzes IS 'Stores quiz data including questions and metadata';
COMMENT ON COLUMN quizzes.id IS 'Unique identifier for the quiz';
COMMENT ON COLUMN quizzes.title IS 'Title of the quiz';
COMMENT ON COLUMN quizzes.description IS 'Description of the quiz';
COMMENT ON COLUMN quizzes.difficulty IS 'Difficulty level: Easy, Medium, or Hard';
COMMENT ON COLUMN quizzes.questions IS 'JSON array containing all quiz questions';
COMMENT ON COLUMN quizzes.metadata IS 'Additional metadata about the quiz';
COMMENT ON COLUMN quizzes.created_at IS 'Timestamp when the quiz was created';
COMMENT ON COLUMN quizzes.updated_at IS 'Timestamp when the quiz was last updated';
