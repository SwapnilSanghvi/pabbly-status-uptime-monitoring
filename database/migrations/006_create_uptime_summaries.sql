-- Create uptime_summaries table
CREATE TABLE IF NOT EXISTS uptime_summaries (
  id SERIAL PRIMARY KEY,
  api_id INTEGER REFERENCES apis(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL, -- '24h', '7d', '30d', '90d'
  uptime_percentage DECIMAL(5,2),
  total_pings INTEGER,
  successful_pings INTEGER,
  failed_pings INTEGER,
  avg_response_time INTEGER,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(api_id, period)
);

-- Create index on api_id and period for fast lookups
CREATE INDEX IF NOT EXISTS idx_uptime_summaries_api_period ON uptime_summaries(api_id, period);
