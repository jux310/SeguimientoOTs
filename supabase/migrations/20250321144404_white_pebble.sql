/*
  # Fix backup restore functionality

  1. Changes
    - Fix validate_backup function to properly handle JSON validation
    - Update restore_backup function to handle errors gracefully
    - Add proper type casting for JSON operations
    - Add better error handling and validation

  2. Security
    - Maintain SECURITY DEFINER for elevated privileges
    - Keep existing RLS policies intact
*/

-- Drop existing functions to recreate them
DROP FUNCTION IF EXISTS validate_backup(json);
DROP FUNCTION IF EXISTS restore_backup(json);

-- Improved backup validation function
CREATE OR REPLACE FUNCTION validate_backup(backup jsonb)
RETURNS boolean AS $$
BEGIN
  -- Check if backup is NULL
  IF backup IS NULL THEN
    RAISE EXCEPTION 'Backup data cannot be NULL';
  END IF;

  -- Check required sections using jsonb operators
  IF NOT (
    backup ? 'metadata' AND
    backup ? 'schema' AND
    backup ? 'data'
  ) THEN
    RAISE EXCEPTION 'Invalid backup structure: missing required sections';
  END IF;

  -- Check metadata structure
  IF NOT (
    (backup->'metadata') ? 'timestamp' AND
    (backup->'metadata') ? 'version' AND
    (backup->'metadata') ? 'type'
  ) THEN
    RAISE EXCEPTION 'Invalid metadata structure';
  END IF;

  -- Check schema section
  IF NOT (
    (backup->'schema') ? 'tables' AND
    (backup->'schema') ? 'functions' AND
    (backup->'schema') ? 'policies'
  ) THEN
    RAISE EXCEPTION 'Invalid schema structure';
  END IF;

  -- Check data section
  IF NOT (backup->'data') ? 'work_orders' THEN
    RAISE EXCEPTION 'Invalid data structure: missing work_orders';
  END IF;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  -- Log the error and return false instead of raising an exception
  RAISE NOTICE 'Backup validation failed: %', SQLERRM;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main restore function with improved error handling
CREATE OR REPLACE FUNCTION restore_backup(backup jsonb)
RETURNS boolean AS $$
DECLARE
  validated boolean;
BEGIN
  -- Validate backup structure
  validated := validate_backup(backup);
  
  IF NOT validated THEN
    RAISE EXCEPTION 'Backup validation failed';
  END IF;

  -- Start transaction
  BEGIN
    -- Restore data (simplified for now, focusing on work orders)
    WITH backup_data AS (
      SELECT jsonb_array_elements(backup->'data'->'work_orders') AS wo
    )
    INSERT INTO work_orders (
      id, ot, client, tag, description, status, progress, priority,
      location, created_at, created_by, updated_at, updated_by
    )
    SELECT 
      (wo->'work_order'->>'id')::uuid,
      wo->'work_order'->>'ot',
      wo->'work_order'->>'client',
      wo->'work_order'->>'tag',
      wo->'work_order'->>'description',
      wo->'work_order'->>'status',
      (wo->'work_order'->>'progress')::integer,
      (wo->'work_order'->>'priority')::boolean,
      wo->'work_order'->>'location',
      (wo->'work_order'->>'created_at')::timestamptz,
      (wo->'work_order'->>'created_by')::uuid,
      (wo->'work_order'->>'updated_at')::timestamptz,
      (wo->'work_order'->>'updated_by')::uuid
    FROM backup_data
    ON CONFLICT (id) DO UPDATE SET
      ot = EXCLUDED.ot,
      client = EXCLUDED.client,
      tag = EXCLUDED.tag,
      description = EXCLUDED.description,
      status = EXCLUDED.status,
      progress = EXCLUDED.progress,
      priority = EXCLUDED.priority,
      location = EXCLUDED.location,
      updated_at = EXCLUDED.updated_at,
      updated_by = EXCLUDED.updated_by;

    RETURN true;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error during restore: %', SQLERRM;
    RETURN false;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION validate_backup(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_backup(jsonb) TO authenticated;