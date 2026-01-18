-- Replace boolean with enum-style text field for notification preferences
-- Drop the old column and add the new one
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email_notifications_enabled;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preference text NOT NULL DEFAULT 'instant' CHECK (notification_preference IN ('instant', 'digest', 'off'));

-- Create a table to store questions for weekly digest
CREATE TABLE IF NOT EXISTS public.digest_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.group_questions(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  question_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(question_id)
);

-- Enable RLS on digest_queue
ALTER TABLE public.digest_queue ENABLE ROW LEVEL SECURITY;

-- Only service role can access digest_queue (used by edge functions only)
CREATE POLICY "Service role only" ON public.digest_queue FOR ALL USING (false);