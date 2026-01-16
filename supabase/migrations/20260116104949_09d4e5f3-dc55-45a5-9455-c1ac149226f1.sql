-- Add support for "removed" status in applications table for soft deletes
-- Valid statuses are now: pending, approved, rejected, removed

-- Update the validation function to accept "removed" status
-- (The current validation function validates input fields, not status)

-- Add a comment documenting the valid statuses
COMMENT ON COLUMN public.applications.status IS 'Valid statuses: pending, approved, rejected, removed. Default: pending. The "removed" status is used for soft deletes.';

-- Create an index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);