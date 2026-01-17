-- Create application_notes table for internal admin tracking
CREATE TABLE public.application_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.application_notes ENABLE ROW LEVEL SECURITY;

-- Only admins can view notes
CREATE POLICY "Admins can view application notes"
ON public.application_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Only admins can create notes
CREATE POLICY "Admins can create application notes"
ON public.application_notes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Only the admin who created the note can delete it
CREATE POLICY "Admins can delete their own notes"
ON public.application_notes
FOR DELETE
USING (
  admin_user_id = auth.uid()
);

-- Create index for faster lookups
CREATE INDEX idx_application_notes_application_id ON public.application_notes(application_id);