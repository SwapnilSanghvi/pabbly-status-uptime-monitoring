-- Add is_public column to apis table
-- This allows categorizing APIs as public (visible to everyone) or private (visible only to admins)

ALTER TABLE apis ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- Add comment to explain the column
COMMENT ON COLUMN apis.is_public IS 'Whether the API is visible on public status page (true) or only to logged-in admins (false)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_apis_is_public ON apis(is_public);
