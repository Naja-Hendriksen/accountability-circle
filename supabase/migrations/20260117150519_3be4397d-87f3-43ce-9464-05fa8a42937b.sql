-- Make avatars bucket private
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Add policy for authenticated users to view avatars of group members
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars' 
  AND (
    -- Users can view their own avatar
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Users can view avatars of users in the same group
    EXISTS (
      SELECT 1 FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
      AND gm2.user_id::text = (storage.foldername(name))[1]
    )
    OR
    -- Admins can view all avatars
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  )
);