-- Add webhook configuration to system settings
-- Migration 010: Add webhook URL and enable/disable toggle

ALTER TABLE system_settings
  ADD COLUMN webhook_url TEXT,
  ADD COLUMN webhook_enabled BOOLEAN DEFAULT FALSE;

-- Initialize webhook as disabled for existing row
UPDATE system_settings SET webhook_enabled = FALSE WHERE id = 1;
