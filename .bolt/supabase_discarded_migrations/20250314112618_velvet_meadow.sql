/*
  # Update issue status options

  1. Changes
    - Remove 'IN_PROGRESS' from status options
    - Update any existing 'IN_PROGRESS' issues to 'OPEN'

  2. Modifications
    - Modify issues table constraint to only allow 'OPEN' or 'RESOLVED'
    - Update existing records with 'IN_PROGRESS' status to 'OPEN'
*/

-- Update existing IN_PROGRESS issues to OPEN
UPDATE issues 
SET status = 'OPEN' 
WHERE status = 'IN_PROGRESS';

-- Drop existing status check constraint
ALTER TABLE issues 
DROP CONSTRAINT IF EXISTS issues_status_check;

-- Add new status check constraint with only OPEN and RESOLVED options
ALTER TABLE issues 
ADD CONSTRAINT issues_status_check 
CHECK (status = ANY (ARRAY['OPEN'::text, 'RESOLVED'::text]));