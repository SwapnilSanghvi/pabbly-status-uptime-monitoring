-- Create apis table
CREATE TABLE IF NOT EXISTS apis (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  monitoring_interval INTEGER DEFAULT 60, -- seconds
  expected_status_code INTEGER DEFAULT 200,
  timeout_duration INTEGER DEFAULT 30000, -- milliseconds
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on is_active for filtering active APIs
CREATE INDEX IF NOT EXISTS idx_apis_is_active ON apis(is_active);

-- Create index on name for search
CREATE INDEX IF NOT EXISTS idx_apis_name ON apis(name);
