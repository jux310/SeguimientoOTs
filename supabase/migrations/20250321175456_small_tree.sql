/*
  # Create work orders table and add priority field

  1. New Tables
    - `work_orders`
      - `id` (uuid, primary key)
      - `ot` (text, unique)
      - `client` (text)
      - `tag` (text)
      - `description` (text)
      - `status` (text)
      - `progress` (integer)
      - `priority` (boolean)
      - `location` (text)
      - Timestamps and audit fields

    - `work_order_history`
      - `id` (uuid, primary key)
      - `work_order_id` (uuid, foreign key)
      - `field` (text)
      - `old_value` (text)
      - `new_value` (text)
      - `changed_at` (timestamptz)
      - `changed_by` (uuid)

  2. Functions
    - `record_work_order_changes`: Trigger function to track changes

  3. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create work_orders table
CREATE TABLE IF NOT EXISTS work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ot text UNIQUE NOT NULL,
  client text NOT NULL,
  tag text NOT NULL,
  description text,
  status text,
  progress integer DEFAULT 0,
  priority boolean DEFAULT false NOT NULL,
  location text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create work_order_history table
CREATE TABLE IF NOT EXISTS work_order_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid REFERENCES work_orders(id) ON DELETE CASCADE,
  field text NOT NULL,
  old_value text,
  new_value text,
  changed_at timestamptz DEFAULT now(),
  changed_by uuid REFERENCES auth.users(id)
);

-- Create trigger function
CREATE OR REPLACE FUNCTION record_work_order_changes()
RETURNS trigger AS $$
BEGIN
  IF (
    NEW.status <> OLD.status OR 
    NEW.progress <> OLD.progress OR
    NEW.priority <> OLD.priority
  ) THEN
    INSERT INTO work_order_history (
      work_order_id,
      field,
      old_value,
      new_value,
      changed_by
    ) VALUES (
      NEW.id,
      CASE
        WHEN NEW.status <> OLD.status THEN 'status'
        WHEN NEW.progress <> OLD.progress THEN 'progress'
        WHEN NEW.priority <> OLD.priority THEN 'priority'
      END,
      CASE
        WHEN NEW.status <> OLD.status THEN OLD.status
        WHEN NEW.progress <> OLD.progress THEN OLD.progress::text
        WHEN NEW.priority <> OLD.priority THEN OLD.priority::text
      END,
      CASE
        WHEN NEW.status <> OLD.status THEN NEW.status
        WHEN NEW.progress <> OLD.progress THEN NEW.progress::text
        WHEN NEW.priority <> OLD.priority THEN NEW.priority::text
      END,
      NEW.updated_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER record_work_order_changes
  AFTER UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION record_work_order_changes();

-- Enable RLS
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users full access to work orders"
  ON work_orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read work order history"
  ON work_order_history
  FOR SELECT
  TO authenticated
  USING (true);