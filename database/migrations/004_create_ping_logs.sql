-- Create ping_logs table
CREATE TABLE IF NOT EXISTS ping_logs (
  id SERIAL PRIMARY KEY,
  api_id INTEGER REFERENCES apis(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL, -- 'success', 'failure', 'timeout'
  status_code INTEGER,
  response_time INTEGER, -- milliseconds
  error_message TEXT,
  pinged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on api_id for faster queries
CREATE INDEX IF NOT EXISTS idx_ping_logs_api_id ON ping_logs(api_id);

-- Create index on pinged_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_ping_logs_pinged_at ON ping_logs(pinged_at);

-- Create composite index for api_id and pinged_at (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_ping_logs_api_pinged ON ping_logs(api_id, pinged_at DESC);
