-- Add name and email columns to applications table
ALTER TABLE public.applications 
ADD COLUMN full_name TEXT NOT NULL DEFAULT '',
ADD COLUMN email TEXT NOT NULL DEFAULT '';

-- Remove defaults after adding (they were just for existing rows)
ALTER TABLE public.applications 
ALTER COLUMN full_name DROP DEFAULT,
ALTER COLUMN email DROP DEFAULT;