-- ============================================================================
-- Migration 002: Add API Groups Feature
-- ============================================================================
-- Description: Adds API groups table and group_id column to apis table
-- Date: 2025-12-30
-- ============================================================================

-- Create api_groups table
CREATE TABLE IF NOT EXISTS api_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_collapsed BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for api_groups
CREATE INDEX IF NOT EXISTS idx_api_groups_display_order ON api_groups(display_order);
CREATE INDEX IF NOT EXISTS idx_api_groups_name ON api_groups(name);
CREATE INDEX IF NOT EXISTS idx_api_groups_is_default ON api_groups(is_default);

-- Add group_id column to apis table
ALTER TABLE apis
ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES api_groups(id) ON DELETE SET NULL;

-- Create index for group_id in apis table
CREATE INDEX IF NOT EXISTS idx_apis_group_id ON apis(group_id);

-- Insert default "Ungrouped" group with fixed ID = 1
-- Using ON CONFLICT on id to allow safe re-runs and prevent conflicts
INSERT INTO api_groups (id, name, description, display_order, is_collapsed, is_default)
VALUES (1, 'Ungrouped', 'APIs without a specific group', 999, FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Set the sequence to start from 2 to avoid conflicts with the default group
SELECT setval('api_groups_id_seq', (SELECT GREATEST(2, MAX(id) + 1) FROM api_groups), false);

-- Assign all existing APIs to the default group (ID = 1)
UPDATE apis
SET group_id = 1
WHERE group_id IS NULL;

-- ============================================================================
-- Migration completed successfully
-- ============================================================================
