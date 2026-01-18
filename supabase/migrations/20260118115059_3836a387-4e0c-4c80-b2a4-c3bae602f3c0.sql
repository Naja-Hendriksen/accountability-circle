-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Users can check own admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;

-- Recreate as PERMISSIVE policies (default) so OR logic applies
CREATE POLICY "Users can check own admin status"
ON public.admin_users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Also allow admins to see all admin users (for admin management)
CREATE POLICY "Admins can view all admin users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()
));