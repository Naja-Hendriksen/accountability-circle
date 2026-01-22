-- Create a secure RPC function that checks if an email has an approved application
-- Returns minimal data: just approval status and name (needed for profile creation)
-- Does NOT expose the full applications table

CREATE OR REPLACE FUNCTION public.check_application_approval(check_email text)
RETURNS TABLE (
  is_approved boolean,
  applicant_first_name text,
  applicant_last_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    true AS is_approved,
    first_name AS applicant_first_name,
    last_name AS applicant_last_name
  FROM public.applications
  WHERE LOWER(email) = LOWER(check_email)
    AND status = 'approved'
  LIMIT 1;
$$;