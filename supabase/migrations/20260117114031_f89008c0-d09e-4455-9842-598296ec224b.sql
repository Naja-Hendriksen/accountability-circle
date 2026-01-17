-- Create email_templates table for customizable notification emails
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can read templates
CREATE POLICY "Admins can view email templates"
ON public.email_templates
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Only admins can update templates
CREATE POLICY "Admins can update email templates"
ON public.email_templates
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Only admins can insert templates
CREATE POLICY "Admins can insert email templates"
ON public.email_templates
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.email_templates (template_key, subject, html_content, description) VALUES
('approved', 'Welcome to the Accountability Circle! 🎉', '<h1>Congratulations, {{name}}!</h1><p>Your application to join the Accountability Circle has been approved!</p><p>We''re thrilled to have you join our community of ambitious women building their first digital product or asset in 2026.</p><h2>What''s Next?</h2><ul><li>You''ll receive an email with details about your first Monday 10am GMT call</li><li>Start thinking about your 3-6 month growth goal</li><li>Prepare to meet your fellow circle members</li></ul><p>Welcome aboard!</p><p>Best,<br>The Accountability Circle Team</p>', 'Sent when an application is approved'),
('rejected', 'Update on Your Accountability Circle Application', '<h1>Hi {{name}},</h1><p>Thank you for your interest in joining the Accountability Circle.</p><p>After careful consideration, we''ve decided not to move forward with your application at this time.</p><p>This doesn''t mean the end of your journey! Here are some resources that might help:</p><ul><li>Continue building in public and sharing your progress</li><li>Connect with other communities focused on digital product creation</li><li>Consider reapplying in the future when circumstances align</li></ul><p>Wishing you all the best on your journey.</p><p>Best,<br>The Accountability Circle Team</p>', 'Sent when an application is rejected'),
('pending', 'We''ve Received Your Application', '<h1>Hi {{name}},</h1><p>Thank you for applying to join the Accountability Circle!</p><p>We''ve received your application and it''s currently under review.</p><p>We carefully review each application to ensure our circle remains a focused, committed group of women supporting each other.</p><p>You''ll hear back from us soon.</p><p>Best,<br>The Accountability Circle Team</p>', 'Sent when application status is set to pending');