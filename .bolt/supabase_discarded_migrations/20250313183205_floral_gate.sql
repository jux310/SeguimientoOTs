/*
  # Add Issues Table and Relations

  1. New Tables
    - `issues`
      - `id` (uuid, primary key)
      - `work_order_id` (uuid, foreign key to work_orders)
      - `title` (text)
      - `description` (text)
      - `status` (text) - 'OPEN', 'IN_PROGRESS', 'RESOLVED'
      - `priority` (text) - 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
      - `created_at` (timestamptz)
      - `created_by` (uuid, foreign key to users)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid, foreign key to users)

  2. Security
    - Enable RLS on `issues` table
    - Add policies for authenticated users to:
      - Read all issues
      - Create issues
      - Update issues they created
*/

-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid REFERENCES work_orders(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN',
  priority text NOT NULL DEFAULT 'MEDIUM',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT issues_status_check CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')),
  CONSTRAINT issues_priority_check CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

-- Enable RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can read issues"
  ON issues
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create issues"
  ON issues
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update their issues"
  ON issues
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Add updated_at trigger
CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();