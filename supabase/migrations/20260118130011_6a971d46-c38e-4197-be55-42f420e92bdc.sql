-- Add first_name and last_name columns to applications table
ALTER TABLE public.applications 
ADD COLUMN first_name text,
ADD COLUMN last_name text;

-- Migrate existing data: split full_name into first_name and last_name
UPDATE public.applications
SET 
  first_name = TRIM(split_part(full_name, ' ', 1)),
  last_name = TRIM(CASE 
    WHEN position(' ' in full_name) > 0 
    THEN substring(full_name from position(' ' in full_name) + 1)
    ELSE ''
  END);

-- Make first_name required (after migration)
ALTER TABLE public.applications 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN first_name SET DEFAULT '';

-- last_name can be optional but default to empty string
ALTER TABLE public.applications 
ALTER COLUMN last_name SET NOT NULL,
ALTER COLUMN last_name SET DEFAULT '';

-- Drop the old full_name column
ALTER TABLE public.applications DROP COLUMN full_name;