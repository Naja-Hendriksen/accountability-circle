-- Make resources bucket private so files require authentication
UPDATE storage.buckets SET public = false WHERE id = 'resources';