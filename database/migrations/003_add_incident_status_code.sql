-- ============================================================================
-- Migration 003: Add Status Code to Incidents
-- ============================================================================
-- Description: Adds status_code column to incidents table to track the HTTP
--              status code that caused the incident (for webhook notifications)
-- Date: 2025-01-13
-- ============================================================================

-- Add status_code column to incidents table
ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS status_code INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN incidents.status_code IS 'HTTP status code that caused the incident (null for timeouts/connection failures)';

-- ============================================================================
-- Migration completed successfully
-- ============================================================================
