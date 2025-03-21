/*
  # Add issues tracking functionality

  1. New Tables
    - `issues`: Main table for tracking problems
      - `id` (uuid, primary key)
      - `work_order_id` (uuid, references work_orders)
      - `title` (text)
      - `stage` (text)
      - `status` (text)
      - `priority` (text)
      - Timestamps and user references
    
    - `issue_notes`: Notes/comments on issues
      - `id` (uuid, primary key)
      - `issue_id` (uuid, references issues)
      - `content` (text)
      - Timestamps and user references
    
    - `issue_delays`: Production delays tracking
      - `id` (uuid, primary key)
      - `issue_id` (uuid, references issues)
      - `start_date` (date)
      - `end_date` (date)
      - Timestamps and user references

  2. Views
    - `issue_notes_with_users`: Combines notes with user information
    
  3. Security
    - RLS enabled on all tables
    - Policies for authenticated users
*/

-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid REFERENCES work_orders(id) ON DELETE CASCADE,
  title text NOT NULL,
  stage text,
  status text NOT NULL DEFAULT 'OPEN',
  priority text NOT NULL DEFAULT 'MEDIUM',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create issue notes table
CREATE TABLE IF NOT EXISTS issue_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES issues(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create issue delays table
CREATE TABLE IF NOT EXISTS issue_delays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES issues(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create view for issue notes with user information
CREATE OR REPLACE VIEW issue_notes_with_users AS
SELECT 
  n.*,
  u.email as user_email
FROM issue_notes n
LEFT JOIN auth.users u ON u.id = n.created_by;

-- Enable RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_delays ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users full access to issues"
  ON issues
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to issue notes"
  ON issue_notes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to issue delays"
  ON issue_delays
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant access to the view
GRANT SELECT ON issue_notes_with_users TO authenticated;