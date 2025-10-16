-- Add updated_at field to rooms table to fix Supabase audit trigger issue

-- Add updated_at field to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to automatically update updated_at field
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rooms table
DROP TRIGGER IF EXISTS trigger_update_rooms_updated_at ON rooms;
CREATE TRIGGER trigger_update_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at field to players table as well for consistency
ALTER TABLE players ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger for players table
DROP TRIGGER IF EXISTS trigger_update_players_updated_at ON players;
CREATE TRIGGER trigger_update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
