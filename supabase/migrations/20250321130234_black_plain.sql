/*
  # Update work order trigger function

  1. Changes
    - Update trigger function to handle priority changes in history
    - No need to add priority column as it already exists
*/

-- Update trigger function to handle priority changes
CREATE OR REPLACE FUNCTION record_work_order_changes()
RETURNS trigger AS $$
BEGIN
  IF (
    NEW.status <> OLD.status OR 
    NEW.progress <> OLD.progress OR
    NEW.priority <> OLD.priority
  ) THEN
    INSERT INTO work_order_history (
      work_order_id,
      field,
      old_value,
      new_value,
      changed_by
    ) VALUES (
      NEW.id,
      CASE
        WHEN NEW.status <> OLD.status THEN 'status'
        WHEN NEW.progress <> OLD.progress THEN 'progress'
        WHEN NEW.priority <> OLD.priority THEN 'priority'
      END,
      CASE
        WHEN NEW.status <> OLD.status THEN OLD.status
        WHEN NEW.progress <> OLD.progress THEN OLD.progress::text
        WHEN NEW.priority <> OLD.priority THEN OLD.priority::text
      END,
      CASE
        WHEN NEW.status <> OLD.status THEN NEW.status
        WHEN NEW.progress <> OLD.progress THEN NEW.progress::text
        WHEN NEW.priority <> OLD.priority THEN NEW.priority::text
      END,
      NEW.updated_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;