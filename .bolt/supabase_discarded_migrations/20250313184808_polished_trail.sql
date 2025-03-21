/*
  # Add issue notes table

  1. New Tables
    - `issue_notes`
      - `id` (uuid, primary key)
      - `issue_id` (uuid, foreign key to issues)
      - `content` (text)
      - `created_at` (timestamp)
      - `created_by` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `issue_notes` table
    - Add policies for authenticated users to:
      - Read all notes
      - Create notes for any issue
*/

-- Create issue notes table
CREATE TABLE IF NOT EXISTS issue_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE issue_notes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read issue notes"
  ON issue_notes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create issue notes"
  ON issue_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Create view for issue notes with user info
CREATE VIEW issue_notes_with_users AS
SELECT 
  n.*,
  u.email as user_email
FROM issue_notes n
LEFT JOIN auth.users u ON u.id = n.created_by;