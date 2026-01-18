-- Delete older duplicate application (keeping the most recent one)
DELETE FROM public.applications 
WHERE email = 'sarahlifelearning@gmail.com' 
AND id = '00173949-851c-4bc9-9e63-b8f17fe795cf';

-- Add unique constraint on email to prevent duplicate applications
ALTER TABLE public.applications 
ADD CONSTRAINT applications_email_unique UNIQUE (email);