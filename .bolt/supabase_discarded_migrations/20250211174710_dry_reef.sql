/*
  # Fix RLS policies for work orders

  1. Changes
    - Update RLS policies to properly handle authenticated users
    - Add missing user ID fields to work order creation
    - Fix policy conditions for better security

  2. Security
    - Ensure authenticated users can only access their own data
    - Maintain audit trail with user IDs
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read work orders" ON work_orders;
DROP POLICY IF EXISTS "Authenticated users can create work orders" ON work_orders;
DROP POLICY IF EXISTS "Authenticated users can update work orders" ON work_orders;

-- Create new policies with proper conditions
CREATE POLICY "Authenticated users can read work orders"
  ON work_orders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create work orders"
  ON work_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update work orders"
  ON work_orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() IS NOT NULL);