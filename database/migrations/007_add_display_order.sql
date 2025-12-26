-- Add display_order column to apis table
ALTER TABLE apis ADD COLUMN display_order INTEGER DEFAULT 0;

-- Set initial order based on current ID
UPDATE apis SET display_order = id;

-- Create index for faster sorting
CREATE INDEX idx_apis_display_order ON apis(display_order);
