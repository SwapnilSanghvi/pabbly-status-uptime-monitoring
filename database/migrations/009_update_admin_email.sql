-- Update admin email from admin@example.com to development@pabbly.com
-- Run this migration to update the existing admin user

UPDATE admin_user
SET
  email = 'development@pabbly.com',
  full_name = 'Pabbly Administrator',
  updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin@example.com';
