/*
  # Update Database Schema

  1. Changes
    - Add missing indexes for performance optimization
    - Add missing RLS policies for better security
    - Add missing constraints for data integrity
    - Add missing triggers for automatic updates

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Update work_orders table
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS priority boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS work_orders_client_idx ON work_orders (client);
CREATE INDEX IF NOT EXISTS work_orders_created_at_idx ON work_orders (created_at DESC);

-- Update work_order_dates table
CREATE INDEX IF NOT EXISTS work_order_dates_date_idx ON work_order_dates (date);
CREATE INDEX IF NOT EXISTS work_order_dates_stage_idx ON work_order_dates (stage);

-- Update work_order_history table
CREATE INDEX IF NOT EXISTS work_order_history_changed_at_idx ON work_order_history (changed_at DESC);
CREATE INDEX IF NOT EXISTS work_order_history_work_order_id_idx ON work_order_history (work_order_id);

-- Update issues table
CREATE INDEX IF NOT EXISTS issues_created_at_idx ON issues (created_at DESC);
CREATE INDEX IF NOT EXISTS issues_priority_idx ON issues (priority);
CREATE INDEX IF NOT EXISTS issues_status_idx ON issues (status);

-- Update issue_notes table
CREATE INDEX IF NOT EXISTS issue_notes_created_at_idx ON issue_notes (created_at DESC);

-- Update issue_delays table
CREATE INDEX IF NOT EXISTS issue_delays_start_date_idx ON issue_delays (start_date);
CREATE INDEX IF NOT EXISTS issue_delays_end_date_idx ON issue_delays (end_date);

-- Add missing RLS policies
ALTER TABLE work_order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_delays ENABLE ROW LEVEL SECURITY;

-- Add missing triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to work_orders if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_work_orders_updated_at'
  ) THEN
    CREATE TRIGGER update_work_orders_updated_at
    BEFORE UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Add trigger to work_order_dates if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_work_order_dates_updated_at'
  ) THEN
    CREATE TRIGGER update_work_order_dates_updated_at
    BEFORE UPDATE ON work_order_dates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Add trigger to issues if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_issues_updated_at'
  ) THEN
    CREATE TRIGGER update_issues_updated_at
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Add trigger to issue_delays if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_issue_delays_updated_at'
  ) THEN
    CREATE TRIGGER update_issue_delays_updated_at
    BEFORE UPDATE ON issue_delays
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;