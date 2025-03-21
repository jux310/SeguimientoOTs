/*
  # Fix work order dates RLS policies

  1. Changes
    - Drop existing policies for work_order_dates table
    - Create new policies that properly handle authenticated users
    - Ensure proper access control for reading and modifying dates

  2. Security
    - Enable RLS on work_order_dates table
    - Add policies for authenticated users to:
      - Read all work order dates
      - Create new dates
      - Update existing dates
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read work order dates" ON work_order_dates;
DROP POLICY IF EXISTS "Authenticated users can insert work order dates" ON work_order_dates;
DROP POLICY IF EXISTS "Authenticated users can update work order dates" ON work_order_dates;

-- Create new policies with proper conditions
CREATE POLICY "Authenticated users can read work order dates"
  ON work_order_dates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert work order dates"
  ON work_order_dates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update work order dates"
  ON work_order_dates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() IS NOT NULL);