-- Add tracking columns to email_history
ALTER TABLE public.email_history 
ADD COLUMN opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN open_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN click_count INTEGER NOT NULL DEFAULT 0;

-- Create email_clicks table to track individual link clicks
CREATE TABLE public.email_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_history_id UUID NOT NULL REFERENCES public.email_history(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_clicks ENABLE ROW LEVEL SECURITY;

-- Only admins can view click data
CREATE POLICY "Admins can view email clicks"
  ON public.email_clicks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Service role can insert (from edge function)
CREATE POLICY "Service role can insert email clicks"
  ON public.email_clicks
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_email_clicks_history_id ON public.email_clicks(email_history_id);