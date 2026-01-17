import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  name: string;
  onUploadComplete: (url: string) => void;
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function AvatarUpload({ 
  currentAvatarUrl, 
  name, 
  onUploadComplete,
  onRemove,
  size = 'lg'
}: AvatarUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 2MB.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache-busting query param
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      onUploadComplete(urlWithCacheBust);
      
      toast({
        title: "Photo uploaded!",
        description: "Your profile photo has been updated."
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!user || !currentAvatarUrl || !onRemove) return;

    setRemoving(true);
    try {
      // Try to delete from storage (might fail if file doesn't exist, which is ok)
      const fileName = `${user.id}/avatar`;
      await supabase.storage
        .from('avatars')
        .remove([`${fileName}.jpg`, `${fileName}.jpeg`, `${fileName}.png`, `${fileName}.gif`, `${fileName}.webp`]);

      onRemove();
      
      toast({
        title: "Photo removed",
        description: "Your profile photo has been removed."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRemoving(false);
    }
  };

  const initials = (name || '?')[0].toUpperCase();

  return (
    <div className="relative group">
      <Avatar className={`${sizeClasses[size]} border-2 border-border`}>
        <AvatarImage src={currentAvatarUrl || undefined} alt={name} />
        <AvatarFallback className="bg-sage-light text-primary font-display font-semibold text-lg">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || removing}
        className={`
          absolute inset-0 rounded-full flex items-center justify-center
          bg-foreground/60 opacity-0 group-hover:opacity-100 
          transition-opacity duration-200 cursor-pointer
          ${uploading || removing ? 'opacity-100' : ''}
        `}
      >
        {uploading ? (
          <Loader2 className={`${iconSizes[size]} text-background animate-spin`} />
        ) : removing ? (
          <Loader2 className={`${iconSizes[size]} text-background animate-spin`} />
        ) : (
          <Camera className={`${iconSizes[size]} text-background`} />
        )}
      </button>

      {/* Remove button - only show when there's an avatar and onRemove is provided */}
      {currentAvatarUrl && onRemove && !uploading && !removing && (
        <button
          onClick={handleRemove}
          className="absolute -top-1 -right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive/90"
          title="Remove photo"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
