-- Fix admin_users policies conflict
-- Drop existing policies that cause conflict
DROP POLICY IF EXISTS "Admin users can read own data" ON admin_users;
DROP POLICY IF EXISTS "Admin users can update own data" ON admin_users;

-- Create new policies with different names to avoid conflict
CREATE POLICY "admin_read_own_data" ON admin_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "admin_update_own_data" ON admin_users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "admin_insert_data" ON admin_users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "admin_delete_own_data" ON admin_users
  FOR DELETE USING (auth.uid() = id);