-- Create default admin user
-- Email: development@pabbly.com
-- Password: 251251
-- Password hash generated with bcrypt (cost factor 10)

INSERT INTO admin_user (email, password_hash, full_name)
VALUES (
  'development@pabbly.com',
  '$2b$10$.p5GZF4uDc6sa1ScC3TnAusIknz1KedVnZEaQwpOSdB9pGinh2cBu', -- password: 251251
  'Pabbly Administrator'
)
ON CONFLICT (email) DO NOTHING;

-- Insert sample APIs for testing
INSERT INTO apis (name, url, expected_status_code, is_active) VALUES
  ('Google Homepage', 'https://www.google.com', 200, TRUE),
  ('GitHub API', 'https://api.github.com', 200, TRUE),
  ('JSONPlaceholder API', 'https://jsonplaceholder.typicode.com/posts/1', 200, TRUE)
ON CONFLICT DO NOTHING;
