-- Update the validate_application function to use first_name and last_name instead of full_name
CREATE OR REPLACE FUNCTION validate_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate first_name length
  IF length(NEW.first_name) > 100 THEN
    RAISE EXCEPTION 'First name must be 100 characters or less';
  END IF;
  
  -- Validate last_name length
  IF length(NEW.last_name) > 100 THEN
    RAISE EXCEPTION 'Last name must be 100 characters or less';
  END IF;
  
  -- Validate email format
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate commitment level range
  IF NEW.commitment_level < 1 OR NEW.commitment_level > 10 THEN
    RAISE EXCEPTION 'Commitment level must be between 1 and 10';
  END IF;
  
  -- Validate text field lengths
  IF length(NEW.growth_goal) > 1000 THEN
    RAISE EXCEPTION 'Growth goal must be 1000 characters or less';
  END IF;
  
  IF length(NEW.commitment_explanation) > 1000 THEN
    RAISE EXCEPTION 'Commitment explanation must be 1000 characters or less';
  END IF;
  
  IF length(NEW.excitement) > 1000 THEN
    RAISE EXCEPTION 'Excitement must be 1000 characters or less';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;