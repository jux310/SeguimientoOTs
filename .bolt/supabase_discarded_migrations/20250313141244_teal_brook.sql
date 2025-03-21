/*
  # Update trigger to track date confirmation changes

  1. Changes
    - Update trigger function to track both date and confirmation changes
    - Record separate history entries for date and confirmation changes
    - Use descriptive field names for better history tracking

  2. Security
    - Maintain existing RLS policies
    - Track all changes in history table
*/

-- Update trigger function to track both date and confirmation changes
CREATE OR REPLACE FUNCTION record_work_order_date_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Record date changes
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
      NEW.stage || ' - Fecha',
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

  -- Record confirmation changes
  IF (TG_OP = 'UPDATE' AND OLD.confirmed IS DISTINCT FROM NEW.confirmed) OR
     (TG_OP = 'INSERT' AND NEW.confirmed IS TRUE) THEN
    INSERT INTO work_order_history (
      work_order_id,
      field,
      old_value,
      new_value,
      changed_by
    ) VALUES (
      NEW.work_order_id,
      NEW.stage || ' - Confirmación',
      CASE 
        WHEN TG_OP = 'UPDATE' THEN 
          CASE WHEN OLD.confirmed THEN 'Confirmada' ELSE 'No confirmada' END
        ELSE 
          'No confirmada'
      END,
      CASE WHEN NEW.confirmed THEN 'Confirmada' ELSE 'No confirmada' END,
      COALESCE(NEW.updated_by, NEW.created_by)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger to ensure clean state
DROP TRIGGER IF EXISTS record_work_order_date_change_trigger ON work_order_dates;
CREATE TRIGGER record_work_order_date_change_trigger
  AFTER INSERT OR UPDATE ON work_order_dates
  FOR EACH ROW
  EXECUTE FUNCTION record_work_order_date_change();