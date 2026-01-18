-- Add email notification preferences column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean NOT NULL DEFAULT true;