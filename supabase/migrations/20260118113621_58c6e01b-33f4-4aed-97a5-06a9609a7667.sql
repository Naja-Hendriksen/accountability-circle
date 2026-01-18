-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;

-- Create a new policy that allows users to check if THEY are an admin
CREATE POLICY "Users can check own admin status"
ON public.admin_users
FOR SELECT
USING (auth.uid() = user_id);

-- Also allow admins to see all admin users (for admin management)
CREATE POLICY "Admins can view all admin users"
ON public.admin_users
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()
));