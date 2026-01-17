-- Create deletion_requests table to track member deletion requests
CREATE TABLE public.deletion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID
);

-- Enable RLS
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

-- Members can submit their own deletion requests
CREATE POLICY "Users can submit their own deletion request"
ON public.deletion_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Members can view their own deletion requests
CREATE POLICY "Users can view their own deletion requests"
ON public.deletion_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all deletion requests
CREATE POLICY "Admins can view all deletion requests"
ON public.deletion_requests
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Admins can update deletion requests (to mark as completed)
CREATE POLICY "Admins can update deletion requests"
ON public.deletion_requests
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);