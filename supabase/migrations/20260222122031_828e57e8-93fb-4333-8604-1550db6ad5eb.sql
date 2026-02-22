
-- Add resource_type and external_link columns
ALTER TABLE public.resources 
  ADD COLUMN resource_type text NOT NULL DEFAULT 'file',
  ADD COLUMN external_link text;

-- Make file columns nullable for info-type resources
ALTER TABLE public.resources 
  ALTER COLUMN file_name DROP NOT NULL,
  ALTER COLUMN file_path DROP NOT NULL;
