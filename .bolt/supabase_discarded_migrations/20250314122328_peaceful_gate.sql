/*
  # Add delay tracking for issues

  1. New Tables
    - `issue_delays`
      - `id` (uuid, primary key)
      - `issue_id` (uuid, references issues)
      - `start_date` (date, required)
      - `end_date` (date, optional)
      - `created_at` (timestamp)
      - `created_by` (uuid, references auth.users)
      - `updated_at` (timestamp)
      - `updated_by` (uuid, references auth.users)

  2. Security
    - Enable RLS on `issue_delays` table
    - Add policies for authenticated users to manage delays
*/

CREATE TABLE IF NOT EXISTS issue_delays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  CHECK (end_date IS NULL OR end_date >= start_date)
);

ALTER TABLE issue_delays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read issue delays"
  ON issue_delays
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert issue delays"
  ON issue_delays
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update their issue delays"
  ON issue_delays
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = updated_by);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_issue_delays_updated_at
  BEFORE UPDATE ON issue_delays
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();