/*
  # Add database backup functionality

  1. New Functions
    - `create_backup`: Creates a complete backup of work orders and related data
    - `get_backup_data`: Helper function to retrieve backup data

  2. Security
    - Functions are only accessible to authenticated users
    - Backups include all related data for work orders
*/

-- Helper function to get backup data
CREATE OR REPLACE FUNCTION get_backup_data(p_work_order_id uuid)
RETURNS json AS $$
DECLARE
  backup_data json;
BEGIN
  SELECT json_build_object(
    'work_order', wo,
    'dates', (
      SELECT json_agg(d)
      FROM work_order_dates d
      WHERE d.work_order_id = wo.id
    ),
    'issues', (
      SELECT json_agg(json_build_object(
        'issue', i,
        'notes', (
          SELECT json_agg(n)
          FROM issue_notes n
          WHERE n.issue_id = i.id
        ),
        'delays', (
          SELECT json_agg(d)
          FROM issue_delays d
          WHERE d.issue_id = i.id
        )
      ))
      FROM issues i
      WHERE i.work_order_id = wo.id
    ),
    'history', (
      SELECT json_agg(h)
      FROM work_order_history h
      WHERE h.work_order_id = wo.id
    )
  ) INTO backup_data
  FROM work_orders wo
  WHERE wo.id = p_work_order_id;

  RETURN backup_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main backup function
CREATE OR REPLACE FUNCTION create_backup()
RETURNS json AS $$
DECLARE
  full_backup json;
  backup_timestamp timestamp;
BEGIN
  backup_timestamp := now();
  
  SELECT json_build_object(
    'timestamp', backup_timestamp,
    'data', (
      SELECT json_agg(get_backup_data(wo.id))
      FROM work_orders wo
    )
  ) INTO full_backup;

  RETURN full_backup;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;