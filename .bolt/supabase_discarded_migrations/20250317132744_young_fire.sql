/*
  # Add confirmed column to work_order_dates

  1. Changes
    - Add confirmed column to work_order_dates table
    - Set default value to false
    - Make column not nullable
    - Update existing records to have confirmed = false

  2. Security
    - Maintains existing RLS policies
*/

-- Add confirmed column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'work_order_dates' 
    AND column_name = 'confirmed'
  ) THEN
    ALTER TABLE work_order_dates 
    ADD COLUMN confirmed boolean NOT NULL DEFAULT false;
  END IF;
END $$;