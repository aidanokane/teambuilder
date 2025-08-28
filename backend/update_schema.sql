-- Migration script to update teams table schema
-- Run this after the main schema.sql to update existing databases

-- First, backup existing data if needed
-- CREATE TABLE teams_backup AS SELECT * FROM teams;

-- Drop existing table (this will lose data - only run in development)
-- DROP TABLE IF EXISTS teams CASCADE;

-- Recreate with new schema (run this if starting fresh)
-- CREATE TABLE teams (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
--     name VARCHAR(255) NOT NULL,
--     pokemon_data JSONB NOT NULL DEFAULT '[]',
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_user_id ON teams(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON teams(created_at);

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'updated_at') THEN
        ALTER TABLE teams ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_teams_updated_at 
    BEFORE UPDATE ON teams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Convert pokemon_data to JSONB if it's currently TEXT
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teams' 
        AND column_name = 'pokemon_data' 
        AND data_type = 'text'
    ) THEN
        -- Convert TEXT to JSONB
        ALTER TABLE teams ALTER COLUMN pokemon_data TYPE JSONB USING pokemon_data::JSONB;
    END IF;
END $$;
