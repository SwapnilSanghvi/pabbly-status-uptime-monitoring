-- ============================================================================
-- Migration 001: Add SMTP Email Settings to system_settings table
-- ============================================================================
-- Description: Adds SMTP configuration columns to store email settings in database
-- Date: 2025-12-30
-- ============================================================================

-- Add SMTP columns to system_settings table
ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS smtp_host TEXT,
ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 587,
ADD COLUMN IF NOT EXISTS smtp_user TEXT,
ADD COLUMN IF NOT EXISTS smtp_pass TEXT,
ADD COLUMN IF NOT EXISTS smtp_from TEXT,
ADD COLUMN IF NOT EXISTS smtp_recipients TEXT;

-- Update existing row to have default smtp_port value
UPDATE system_settings
SET smtp_port = 587
WHERE id = 1 AND smtp_port IS NULL;

-- ============================================================================
-- Migration completed successfully
-- ============================================================================
