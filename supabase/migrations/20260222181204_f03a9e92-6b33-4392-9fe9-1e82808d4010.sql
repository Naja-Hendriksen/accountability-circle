-- Fix group_questions INSERT policy: is_group_member args were swapped
DROP POLICY "Group members can create questions" ON public.group_questions;
CREATE POLICY "Group members can create questions"
  ON public.group_questions
  FOR INSERT
  WITH CHECK (is_group_member(auth.uid(), group_id) AND (auth.uid() = user_id));

-- Fix group_questions SELECT policy too
DROP POLICY "Group members can view questions" ON public.group_questions;
CREATE POLICY "Group members can view questions"
  ON public.group_questions
  FOR SELECT
  USING (is_group_member(auth.uid(), group_id));