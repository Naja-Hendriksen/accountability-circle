-- Create email_history table to track sent notifications
CREATE TABLE public.email_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  template_key TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.email_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view email history
CREATE POLICY "Admins can view email history"
  ON public.email_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Only service role can insert (from edge function)
CREATE POLICY "Service role can insert email history"
  ON public.email_history
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_email_history_application_id ON public.email_history(application_id);
CREATE INDEX idx_email_history_sent_at ON public.email_history(sent_at DESC);