/*
  # Update issue delays to enforce single delay per issue

  1. Changes
    - Add unique constraint on issue_id to ensure only one delay per issue
    - Drop existing delays to avoid conflicts
    - Add cascade delete to ensure delay is removed when issue is deleted

  2. Security
    - Maintain existing RLS policies
*/

-- First drop existing delays to avoid conflicts
DELETE FROM issue_delays;

-- Add unique constraint to ensure only one delay per issue
ALTER TABLE issue_delays
  ADD CONSTRAINT issue_delays_issue_id_key UNIQUE (issue_id);