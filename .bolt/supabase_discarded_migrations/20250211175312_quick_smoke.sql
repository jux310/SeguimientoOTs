/*
  # Add work order dates trigger

  1. Changes
    - Add trigger to automatically set created_by on insert
    - Ensures created_by is always set to the authenticated user

  2. Security
    - Maintains data integrity by ensuring created_by is always set
    - Uses auth.uid() to get the current user
*/

-- Create trigger function
CREATE OR REPLACE FUNCTION set_work_order_dates_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_work_order_dates_created_by_trigger ON work_order_dates;
CREATE TRIGGER set_work_order_dates_created_by_trigger
  BEFORE INSERT ON work_order_dates
  FOR EACH ROW
  EXECUTE FUNCTION set_work_order_dates_created_by();