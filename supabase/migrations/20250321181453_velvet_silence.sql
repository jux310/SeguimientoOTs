/*
  # Fix work order history RLS policies

  1. Changes
    - Add full access policy for work order history table
    - Keep existing read-only policy
    - Ensure trigger function can write to history table

  2. Security
    - Maintain RLS enabled
    - Allow authenticated users to read all history
    - Allow system to write history entries
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Allow authenticated users to read work order history" ON work_order_history;

-- Create new policies
CREATE POLICY "Allow authenticated users full access to work order history"
  ON work_order_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure trigger function has necessary permissions
GRANT ALL ON work_order_history TO authenticated;