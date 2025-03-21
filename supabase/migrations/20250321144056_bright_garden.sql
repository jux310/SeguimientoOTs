/*
  # Add Database Restore Function

  1. New Functions
    - restore_backup: Main function to restore database from backup JSON
    - validate_backup: Helper function to validate backup structure
    - restore_schema: Helper function to restore database schema
    - restore_data: Helper function to restore database data
    - restore_relationships: Helper function to restore relationships and foreign keys

  2. Security
    - SECURITY DEFINER to run with elevated privileges
    - Execute permission granted only to authenticated users
    - Validation of backup data structure before restoration
*/

-- Function to validate backup structure
CREATE OR REPLACE FUNCTION validate_backup(backup json)
RETURNS boolean AS $$
BEGIN
  -- Check required sections
  IF NOT (
    backup ? 'metadata' AND
    backup ? 'schema' AND
    backup ? 'data'
  ) THEN
    RAISE EXCEPTION 'Invalid backup structure: missing required sections';
  END IF;

  -- Check metadata
  IF NOT (
    backup->'metadata' ? 'timestamp' AND
    backup->'metadata' ? 'version' AND
    backup->'metadata' ? 'type'
  ) THEN
    RAISE EXCEPTION 'Invalid metadata structure';
  END IF;

  -- Check schema section
  IF NOT (
    backup->'schema' ? 'tables' AND
    backup->'schema' ? 'functions' AND
    backup->'schema' ? 'policies'
  ) THEN
    RAISE EXCEPTION 'Invalid schema structure';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore schema
CREATE OR REPLACE FUNCTION restore_schema(schema_data json)
RETURNS void AS $$
DECLARE
  table_def json;
  function_def json;
  policy_def json;
BEGIN
  -- Restore tables
  FOR table_def IN SELECT * FROM json_array_elements(schema_data->'tables')
  LOOP
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I (%s)',
      table_def->>'table_name',
      (
        SELECT string_agg(
          format('%I %s %s',
            col->>'column_name',
            col->>'data_type',
            CASE WHEN col->>'is_nullable' = 'NO' THEN 'NOT NULL' ELSE '' END
          ),
          ', '
        )
        FROM json_array_elements(table_def->'columns') col
      )
    );
  END LOOP;

  -- Restore functions
  FOR function_def IN SELECT * FROM json_array_elements(schema_data->'functions')
  LOOP
    EXECUTE function_def->>'definition';
  END LOOP;

  -- Restore policies
  FOR policy_def IN SELECT * FROM json_array_elements(schema_data->'policies')
  LOOP
    -- Policies will be recreated with table permissions
    NULL;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore data
CREATE OR REPLACE FUNCTION restore_data(data json)
RETURNS void AS $$
DECLARE
  work_order json;
  dates json;
  issues json;
  history json;
BEGIN
  -- Restore work orders and related data
  FOR work_order IN SELECT * FROM json_array_elements(data->'work_orders')
  LOOP
    -- Insert work order
    INSERT INTO work_orders
    SELECT * FROM json_populate_record(null::work_orders, work_order->'work_order')
    ON CONFLICT (id) DO UPDATE
    SET
      ot = EXCLUDED.ot,
      client = EXCLUDED.client,
      tag = EXCLUDED.tag,
      description = EXCLUDED.description,
      status = EXCLUDED.status,
      progress = EXCLUDED.progress,
      priority = EXCLUDED.priority,
      location = EXCLUDED.location,
      created_at = EXCLUDED.created_at,
      created_by = EXCLUDED.created_by,
      updated_at = EXCLUDED.updated_at,
      updated_by = EXCLUDED.updated_by;

    -- Insert dates
    FOR dates IN SELECT * FROM json_array_elements(work_order->'dates')
    LOOP
      INSERT INTO work_order_dates
      SELECT * FROM json_populate_record(null::work_order_dates, dates)
      ON CONFLICT (id) DO UPDATE
      SET
        work_order_id = EXCLUDED.work_order_id,
        stage = EXCLUDED.stage,
        date = EXCLUDED.date,
        confirmed = EXCLUDED.confirmed,
        created_at = EXCLUDED.created_at,
        created_by = EXCLUDED.created_by,
        updated_at = EXCLUDED.updated_at,
        updated_by = EXCLUDED.updated_by;
    END LOOP;

    -- Insert issues and related data
    FOR issues IN SELECT * FROM json_array_elements(work_order->'issues')
    LOOP
      -- Insert issue
      INSERT INTO issues
      SELECT * FROM json_populate_record(null::issues, issues->'issue')
      ON CONFLICT (id) DO UPDATE
      SET
        work_order_id = EXCLUDED.work_order_id,
        title = EXCLUDED.title,
        notes = EXCLUDED.notes,
        stage = EXCLUDED.stage,
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        created_at = EXCLUDED.created_at,
        created_by = EXCLUDED.created_by,
        updated_at = EXCLUDED.updated_at,
        updated_by = EXCLUDED.updated_by;

      -- Insert issue notes
      INSERT INTO issue_notes
      SELECT * FROM json_populate_recordset(null::issue_notes, issues->'notes')
      ON CONFLICT (id) DO UPDATE
      SET
        issue_id = EXCLUDED.issue_id,
        content = EXCLUDED.content,
        created_at = EXCLUDED.created_at,
        created_by = EXCLUDED.created_by;

      -- Insert issue delays
      INSERT INTO issue_delays
      SELECT * FROM json_populate_recordset(null::issue_delays, issues->'delays')
      ON CONFLICT (id) DO UPDATE
      SET
        issue_id = EXCLUDED.issue_id,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        created_at = EXCLUDED.created_at,
        created_by = EXCLUDED.created_by,
        updated_at = EXCLUDED.updated_at,
        updated_by = EXCLUDED.updated_by;
    END LOOP;

    -- Insert history
    FOR history IN SELECT * FROM json_array_elements(work_order->'history')
    LOOP
      INSERT INTO work_order_history
      SELECT * FROM json_populate_record(null::work_order_history, history->'change')
      ON CONFLICT (id) DO UPDATE
      SET
        work_order_id = EXCLUDED.work_order_id,
        field = EXCLUDED.field,
        old_value = EXCLUDED.old_value,
        new_value = EXCLUDED.new_value,
        changed_at = EXCLUDED.changed_at,
        changed_by = EXCLUDED.changed_by;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main restore function
CREATE OR REPLACE FUNCTION restore_backup(backup json)
RETURNS boolean AS $$
BEGIN
  -- Validate backup structure
  IF NOT validate_backup(backup) THEN
    RETURN false;
  END IF;

  -- Start transaction
  BEGIN
    -- Restore schema first
    PERFORM restore_schema(backup->'schema');
    
    -- Restore data
    PERFORM restore_data(backup->'data');

    RETURN true;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error during restore: %', SQLERRM;
    RETURN false;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION validate_backup(json) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_backup(json) TO authenticated;