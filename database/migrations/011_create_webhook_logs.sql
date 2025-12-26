-- Create webhook logs table for tracking all webhook deliveries
-- Migration 011: Webhook delivery audit trail

CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  webhook_url TEXT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  api_id INTEGER REFERENCES apis(id) ON DELETE CASCADE,
  incident_id INTEGER REFERENCES incidents(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  response_time INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_webhook_logs_api_id ON webhook_logs(api_id);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_success ON webhook_logs(success);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);
