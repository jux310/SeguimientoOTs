/*
  # Update priority display in history

  1. Changes
    - Modify the record_work_order_changes function to display priority changes as "Normal"/"Prioritaria"
    - Improves readability in the change history view
*/

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
        WHEN NEW.priority <> OLD.priority THEN 'Prioridad'
      END,
      CASE
        WHEN NEW.status <> OLD.status THEN OLD.status
        WHEN NEW.progress <> OLD.progress THEN OLD.progress::text
        WHEN NEW.priority <> OLD.priority THEN CASE WHEN OLD.priority THEN 'Prioritaria' ELSE 'Normal' END
      END,
      CASE
        WHEN NEW.status <> OLD.status THEN NEW.status
        WHEN NEW.progress <> OLD.progress THEN NEW.progress::text
        WHEN NEW.priority <> OLD.priority THEN CASE WHEN NEW.priority THEN 'Prioritaria' ELSE 'Normal' END
      END,
      NEW.updated_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;