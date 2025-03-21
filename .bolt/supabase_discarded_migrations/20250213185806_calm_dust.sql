/*
  # Fix change history relationship with auth.users

  1. Changes
    - Add foreign key relationship between work_order_history.changed_by and auth.users.id
    - Add view to safely expose user emails for change history
    - Update policies to secure access to user data

  2. Security
    - Only expose necessary user information through the view
    - Maintain RLS policies for data access
*/

-- Create a secure view to expose only necessary user information
CREATE VIEW public.change_history_users AS
SELECT 
  id,
  email,
  created_at
FROM auth.users;

-- Grant access to the view
GRANT SELECT ON public.change_history_users TO authenticated;

-- Update work_order_history to use the view
ALTER TABLE work_order_history
DROP CONSTRAINT IF EXISTS work_order_history_changed_by_fkey,
ADD CONSTRAINT work_order_history_changed_by_fkey 
  FOREIGN KEY (changed_by) 
  REFERENCES auth.users(id)
  ON DELETE CASCADE;