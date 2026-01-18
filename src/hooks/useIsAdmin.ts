import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('useIsAdmin: No user id');
        return false;
      }
      
      console.log('useIsAdmin: Checking admin status for user:', user.id);
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log('useIsAdmin: Query result:', { data, error });
      
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      const isAdmin = !!data;
      console.log('useIsAdmin: Is admin?', isAdmin);
      return isAdmin;
    },
    enabled: !!user?.id,
  });
}
