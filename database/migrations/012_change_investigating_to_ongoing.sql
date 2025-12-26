-- Change incident status from 'investigating' to 'ongoing'
-- Migration 012: Update status terminology

-- Update existing incidents with 'investigating' status to 'ongoing'
UPDATE incidents
SET status = 'ongoing'
WHERE status = 'investigating';

-- Note: The status column doesn't have a CHECK constraint, so no schema change needed
-- Future incidents will be created with 'ongoing' status instead of 'investigating'
