-- ============================================================================
-- MIGRATION: Add Teacher Profile Fields
-- Description: Adds bio, profile_image_url, and updated_at fields to users table
-- Author: Senior Backend Engineer
-- Date: 2024-11-09
-- ============================================================================

-- Add bio column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'bio'
  ) THEN
    ALTER TABLE users ADD COLUMN bio TEXT;
    COMMENT ON COLUMN users.bio IS 'Teacher biography (max 500 chars)';
  END IF;
END $$;

-- Add profile_image_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'profile_image_url'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_image_url TEXT;
    COMMENT ON COLUMN users.profile_image_url IS 'URL to teacher profile image';
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    COMMENT ON COLUMN users.updated_at IS 'Timestamp of last profile update';
  END IF;
END $$;

-- Add constraint for bio length (max 500 characters)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'bio_length_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT bio_length_check
      CHECK (bio IS NULL OR char_length(bio) <= 500);
  END IF;
END $$;

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS set_updated_at ON users;

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update role constraint to include 'studente' if not already present
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_role_check' AND table_name = 'users'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;

  -- Add new constraint with all three roles
  ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('admin', 'docente', 'studente'));
END $$;

-- Update status constraint to include 'inactive' if not already present
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_status_check' AND table_name = 'users'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_status_check;
  END IF;

  -- Add new constraint with all statuses
  ALTER TABLE users ADD CONSTRAINT users_status_check
    CHECK (status IN ('active', 'invited', 'suspended', 'inactive'));
END $$;

-- Add index for status column for faster filtering
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Add comment on users table
COMMENT ON TABLE users IS 'User profiles for teachers, admins, and students';
