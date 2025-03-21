/*
  # Add missing tables and relationships

  1. New Tables
    - work_order_dates: Stores dates for work order stages
    - change_history_users: View for user information in history

  2. Changes
    - Add foreign key relationships
    - Add RLS policies
    - Create view for user information
*/

-- Create work_order_dates table
CREATE TABLE IF NOT EXISTS work_order_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid REFERENCES work_orders(id) ON DELETE CASCADE,
  stage text NOT NULL,
  date date,
  confirmed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on work_order_dates
ALTER TABLE work_order_dates ENABLE ROW LEVEL SECURITY;

-- Create policy for work_order_dates
CREATE POLICY "Allow authenticated users full access to work order dates"
  ON work_order_dates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create view for user information in history
CREATE OR REPLACE VIEW change_history_users AS
SELECT 
  id,
  email,
  created_at
FROM auth.users;

-- Grant access to the view
GRANT SELECT ON change_history_users TO authenticated;

-- Create view for work order history with user information
CREATE OR REPLACE VIEW work_order_history_with_users AS
SELECT 
  woh.*,
  wo.ot,
  u.email as user_email
FROM work_order_history woh
LEFT JOIN work_orders wo ON wo.id = woh.work_order_id
LEFT JOIN auth.users u ON u.id = woh.changed_by;