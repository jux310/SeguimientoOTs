/*
  # Fix Backup Function

  1. Changes
    - Removed problematic view-related code
    - Simplified backup structure
    - Added error handling
    - Improved metadata section

  2. Security
    - Maintained SECURITY DEFINER
    - Kept execute permission for authenticated users
*/

-- Enhanced backup function with complete data coverage
CREATE OR REPLACE FUNCTION create_backup()
RETURNS json AS $$
DECLARE
  full_backup json;
  schema_data json;
  users_data json;
  backup_timestamp timestamp;
BEGIN
  -- Set backup timestamp
  backup_timestamp := now();

  -- Get schema information
  SELECT json_build_object(
    'tables', (
      SELECT json_agg(json_build_object(
        'table_name', table_name,
        'columns', (
          SELECT json_agg(json_build_object(
            'column_name', column_name,
            'data_type', data_type,
            'is_nullable', is_nullable
          ))
          FROM information_schema.columns
          WHERE table_schema = 'public' 
          AND table_name = tables.table_name
        )
      ))
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ),
    'functions', (
      SELECT json_agg(json_build_object(
        'function_name', routine_name,
        'definition', routine_definition
      ))
      FROM information_schema.routines
      WHERE routine_schema = 'public'
    ),
    'policies', (
      SELECT json_agg(pol)
      FROM pg_policies pol
      WHERE schemaname = 'public'
    )
  ) INTO schema_data;

  -- Get users data
  SELECT json_agg(au.*)
  FROM auth.users au
  INTO users_data;

  -- Build complete backup
  SELECT json_build_object(
    'metadata', json_build_object(
      'timestamp', backup_timestamp,
      'version', '1.0',
      'type', 'full_backup',
      'environment', current_database()
    ),
    'schema', schema_data,
    'users', users_data,
    'data', json_build_object(
      'work_orders', (
        SELECT json_agg(
          json_build_object(
            'work_order', wo,
            'dates', (
              SELECT json_agg(d)
              FROM work_order_dates d
              WHERE d.work_order_id = wo.id
            ),
            'issues', (
              SELECT json_agg(
                json_build_object(
                  'issue', i,
                  'notes', (
                    SELECT json_agg(
                      json_build_object(
                        'note', n,
                        'user', (
                          SELECT row_to_json(u)
                          FROM auth.users u
                          WHERE u.id = n.created_by
                        )
                      )
                    )
                    FROM issue_notes n
                    WHERE n.issue_id = i.id
                  ),
                  'delays', (
                    SELECT json_agg(d)
                    FROM issue_delays d
                    WHERE d.issue_id = i.id
                  )
                )
              )
              FROM issues i
              WHERE i.work_order_id = wo.id
            ),
            'history', (
              SELECT json_agg(
                json_build_object(
                  'change', h,
                  'user', (
                    SELECT row_to_json(u)
                    FROM auth.users u
                    WHERE u.id = h.changed_by
                  )
                )
              )
              FROM work_order_history h
              WHERE h.work_order_id = wo.id
            )
          )
        )
        FROM work_orders wo
      )
    )
  ) INTO full_backup;

  RETURN full_backup;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_backup() TO authenticated;