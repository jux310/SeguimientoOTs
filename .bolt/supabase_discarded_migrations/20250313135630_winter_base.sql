/*
  # Add trigger for tracking work order date changes

  1. Changes
    - Add trigger to automatically record date changes in work_order_history
    - Track all date modifications with user information
    - Store both old and new values for audit trail

  2. Security
    - Maintains existing RLS policies
    - Automatically captures user information for audit
*/

-- Create trigger function to record date changes
CREATE OR REPLACE FUNCTION record_work_order_date_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.date IS DISTINCT FROM NEW.date) OR
     (TG_OP = 'INSERT' AND NEW.date IS NOT NULL) THEN
    INSERT INTO work_order_history (
      work_order_id,
      field,
      old_value,
      new_value,
      changed_by
    ) VALUES (
      NEW.work_order_id,
      NEW.stage,
      CASE 
        WHEN TG_OP = 'UPDATE' THEN 
          COALESCE(to_char(OLD.date, 'YYYY-MM-DD'), '')
        ELSE 
          ''
      END,
      COALESCE(to_char(NEW.date, 'YYYY-MM-DD'), ''),
      COALESCE(NEW.updated_by, NEW.created_by)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for work_order_dates
DROP TRIGGER IF EXISTS record_work_order_date_change_trigger ON work_order_dates;
CREATE TRIGGER record_work_order_date_change_trigger
  AFTER INSERT OR UPDATE ON work_order_dates
  FOR EACH ROW
  EXECUTE FUNCTION record_work_order_date_change();