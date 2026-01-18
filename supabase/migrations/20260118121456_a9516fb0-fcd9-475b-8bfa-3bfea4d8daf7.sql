-- Create security definer function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = _user_id
  )
$$;

-- Create security definer function to check if user is in same group as another user
CREATE OR REPLACE FUNCTION public.is_in_same_group(_user_id uuid, _other_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = _user_id AND gm2.user_id = _other_user_id
  )
$$;

-- Create security definer function to check if user is member of a specific group
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- ============= Fix admin_users policies =============
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can check own admin status" ON public.admin_users;

CREATE POLICY "Users can check own admin status"
ON public.admin_users FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all admin users"
ON public.admin_users FOR SELECT
USING (public.is_admin(auth.uid()));

-- ============= Fix group_members policies =============
DROP POLICY IF EXISTS "Admins can manage all group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;

CREATE POLICY "Admins can manage all group members"
ON public.group_members FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view group members in their groups"
ON public.group_members FOR SELECT
USING (public.is_group_member(auth.uid(), group_id));

-- ============= Fix groups policies =============
DROP POLICY IF EXISTS "Admins can manage all groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view own groups" ON public.groups;

CREATE POLICY "Admins can manage all groups"
ON public.groups FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their groups"
ON public.groups FOR SELECT
USING (public.is_group_member(auth.uid(), id));

-- ============= Fix profiles policies =============
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view group members profiles" ON public.profiles;

CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view group members profiles"
ON public.profiles FOR SELECT
USING (public.is_in_same_group(auth.uid(), user_id));

-- ============= Fix weekly_entries policies =============
DROP POLICY IF EXISTS "Admins can manage all weekly entries" ON public.weekly_entries;
DROP POLICY IF EXISTS "Users can view group members weekly entries" ON public.weekly_entries;

CREATE POLICY "Admins can manage all weekly entries"
ON public.weekly_entries FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view group members weekly entries"
ON public.weekly_entries FOR SELECT
USING (public.is_in_same_group(auth.uid(), user_id));

-- ============= Fix mini_moves policies =============
DROP POLICY IF EXISTS "Admins can manage all mini moves" ON public.mini_moves;
DROP POLICY IF EXISTS "Users can view group members mini moves" ON public.mini_moves;

CREATE POLICY "Admins can manage all mini moves"
ON public.mini_moves FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view group members mini moves"
ON public.mini_moves FOR SELECT
USING (public.is_in_same_group(auth.uid(), user_id));

-- ============= Fix applications policies =============
DROP POLICY IF EXISTS "Admin users can view applications" ON public.applications;
DROP POLICY IF EXISTS "Admin users can update applications" ON public.applications;

CREATE POLICY "Admin users can view applications"
ON public.applications FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin users can update applications"
ON public.applications FOR UPDATE
USING (public.is_admin(auth.uid()));

-- ============= Fix application_notes policies =============
DROP POLICY IF EXISTS "Admins can view application notes" ON public.application_notes;
DROP POLICY IF EXISTS "Admins can create application notes" ON public.application_notes;

CREATE POLICY "Admins can view application notes"
ON public.application_notes FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create application notes"
ON public.application_notes FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- ============= Fix audit_logs policies =============
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- ============= Fix deletion_requests policies =============
DROP POLICY IF EXISTS "Admins can view all deletion requests" ON public.deletion_requests;
DROP POLICY IF EXISTS "Admins can update deletion requests" ON public.deletion_requests;

CREATE POLICY "Admins can view all deletion requests"
ON public.deletion_requests FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update deletion requests"
ON public.deletion_requests FOR UPDATE
USING (public.is_admin(auth.uid()));

-- ============= Fix email_clicks policies =============
DROP POLICY IF EXISTS "Admins can view email clicks" ON public.email_clicks;

CREATE POLICY "Admins can view email clicks"
ON public.email_clicks FOR SELECT
USING (public.is_admin(auth.uid()));

-- ============= Fix email_history policies =============
DROP POLICY IF EXISTS "Admins can view email history" ON public.email_history;

CREATE POLICY "Admins can view email history"
ON public.email_history FOR SELECT
USING (public.is_admin(auth.uid()));

-- ============= Fix email_templates policies =============
DROP POLICY IF EXISTS "Admins can view email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can insert email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can update email templates" ON public.email_templates;

CREATE POLICY "Admins can view email templates"
ON public.email_templates FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert email templates"
ON public.email_templates FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update email templates"
ON public.email_templates FOR UPDATE
USING (public.is_admin(auth.uid()));