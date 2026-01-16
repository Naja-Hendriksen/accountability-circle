-- Add explicit policies to deny UPDATE and DELETE on audit_logs
-- This ensures audit trail integrity by making it impossible for anyone (including admins) to modify or delete audit records

-- Create a policy that explicitly denies UPDATE operations
CREATE POLICY "No one can update audit logs"
ON public.audit_logs
FOR UPDATE
USING (false);

-- Create a policy that explicitly denies DELETE operations  
CREATE POLICY "No one can delete audit logs"
ON public.audit_logs
FOR DELETE
USING (false);