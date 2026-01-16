-- Add length constraints to applications table for input validation
-- Using triggers instead of CHECK constraints for better maintainability

-- Create a validation function for applications
CREATE OR REPLACE FUNCTION public.validate_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate full_name length
  IF length(NEW.full_name) > 200 THEN
    RAISE EXCEPTION 'Full name must be 200 characters or less';
  END IF;
  
  -- Validate email format and length
  IF length(NEW.email) > 255 THEN
    RAISE EXCEPTION 'Email must be 255 characters or less';
  END IF;
  
  IF NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate location length
  IF length(NEW.location) > 100 THEN
    RAISE EXCEPTION 'Location must be 100 characters or less';
  END IF;
  
  -- Validate availability length
  IF length(NEW.availability) > 100 THEN
    RAISE EXCEPTION 'Availability must be 100 characters or less';
  END IF;
  
  -- Validate commitment_explanation length (roughly 200 words = ~1500 chars)
  IF length(NEW.commitment_explanation) > 1500 THEN
    RAISE EXCEPTION 'Commitment explanation must be 1500 characters or less';
  END IF;
  
  -- Validate growth_goal length (150 words = ~1000 chars)
  IF length(NEW.growth_goal) > 1500 THEN
    RAISE EXCEPTION 'Growth goal must be 1500 characters or less';
  END IF;
  
  -- Validate digital_product length (200 words = ~1500 chars)
  IF length(NEW.digital_product) > 2000 THEN
    RAISE EXCEPTION 'Digital product description must be 2000 characters or less';
  END IF;
  
  -- Validate excitement length (100 words = ~750 chars)
  IF length(NEW.excitement) > 1000 THEN
    RAISE EXCEPTION 'Excitement response must be 1000 characters or less';
  END IF;
  
  -- Validate commitment_level range
  IF NEW.commitment_level < 1 OR NEW.commitment_level > 10 THEN
    RAISE EXCEPTION 'Commitment level must be between 1 and 10';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for validation on insert
CREATE TRIGGER validate_application_before_insert
  BEFORE INSERT ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_application();

-- Note: The "Anyone can submit applications" policy with WITH CHECK (true) 
-- is intentional for a public application form. The validation trigger above
-- provides server-side input validation to prevent abuse.