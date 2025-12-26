-- Create system_settings table (single row for global settings)
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  page_title VARCHAR(255) DEFAULT 'System Status',
  logo_url TEXT,
  brand_color VARCHAR(7) DEFAULT '#3b82f6',
  custom_message TEXT,
  notification_email VARCHAR(255),
  notifications_enabled BOOLEAN DEFAULT FALSE,
  data_retention_days INTEGER DEFAULT 90,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default settings row
INSERT INTO system_settings (id, page_title, brand_color, notifications_enabled, data_retention_days)
VALUES (1, 'System Status', '#3b82f6', FALSE, 90)
ON CONFLICT (id) DO NOTHING;
