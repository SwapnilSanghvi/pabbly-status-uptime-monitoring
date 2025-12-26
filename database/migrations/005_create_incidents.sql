-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  api_id INTEGER REFERENCES apis(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'investigating',
  -- investigating/identified/monitoring/resolved
  started_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on api_id for fetching incidents per API
CREATE INDEX IF NOT EXISTS idx_incidents_api_id ON incidents(api_id);

-- Create index on status for filtering active incidents
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);

-- Create index on started_at for sorting by time
CREATE INDEX IF NOT EXISTS idx_incidents_started_at ON incidents(started_at DESC);
