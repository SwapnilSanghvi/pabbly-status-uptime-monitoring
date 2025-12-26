-- Add response_body and response_headers columns to ping_logs table
-- These columns will store full HTTP response details when an API ping fails

ALTER TABLE ping_logs
ADD COLUMN response_body TEXT,
ADD COLUMN response_headers JSONB;

-- Add comment for documentation
COMMENT ON COLUMN ping_logs.response_body IS 'Full response body text when ping fails (truncated to 50KB max)';
COMMENT ON COLUMN ping_logs.response_headers IS 'HTTP response headers as JSON when ping fails';
