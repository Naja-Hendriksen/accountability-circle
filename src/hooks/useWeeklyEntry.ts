import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { startOfWeek, format } from 'date-fns';

export interface WeeklyEntry {
  id: string;
  user_id: string;
  week_start: string;
  obstacles: string | null;
  wins: string | null;
  self_care: string | null;
  created_at: string;
  updated_at: string;
}

export interface MiniMove {
  id: string;
  weekly_entry_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

function getWeekStart(date: Date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function useCurrentWeekEntry() {
  const { user } = useAuth();
  const weekStart = getWeekStart();

  return useQuery({
    queryKey: ['weeklyEntry', user?.id, weekStart],
    queryFn: async () => {
      if (!user) return null;

      // Try to get existing entry
      let { data, error } = await supabase
        .from('weekly_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle();

      if (error) throw error;

      // Create entry if it doesn't exist
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('weekly_entries')
          .insert({ user_id: user.id, week_start: weekStart })
          .select()
          .single();

        if (insertError) throw insertError;
        data = newData;
      }

      return data as WeeklyEntry;
    },
    enabled: !!user,
  });
}

export function usePreviousWeekEntry() {
  const { user } = useAuth();
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const weekStart = getWeekStart(lastWeek);

  return useQuery({
    queryKey: ['weeklyEntry', user?.id, weekStart],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('weekly_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle();

      if (error) throw error;
      return data as WeeklyEntry | null;
    },
    enabled: !!user,
  });
}

// Get all historical weekly entries (excluding current week)
export function useAllWeeklyEntries() {
  const { user } = useAuth();
  const currentWeekStart = getWeekStart();

  return useQuery({
    queryKey: ['allWeeklyEntries', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('weekly_entries')
        .select('*')
        .eq('user_id', user.id)
        .lt('week_start', currentWeekStart)
        .order('week_start', { ascending: false });

      if (error) throw error;
      return data as WeeklyEntry[];
    },
    enabled: !!user,
  });
}

// Helper to check if a week is editable (current week or last week)
export function isWeekEditable(weekStart: string): boolean {
  const currentWeekStart = getWeekStart();
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastWeekStart = getWeekStart(lastWeek);
  
  return weekStart === currentWeekStart || weekStart === lastWeekStart;
}

export function useUpdateWeeklyEntry() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WeeklyEntry> }) => {
      const { error } = await supabase
        .from('weekly_entries')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklyEntry', user?.id] });
    },
  });
}

export function useMiniMoves(weeklyEntryId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['miniMoves', weeklyEntryId],
    queryFn: async () => {
      if (!weeklyEntryId) return [];

      const { data, error } = await supabase
        .from('mini_moves')
        .select('*')
        .eq('weekly_entry_id', weeklyEntryId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as MiniMove[];
    },
    enabled: !!user && !!weeklyEntryId,
  });
}

export function useAddMiniMove() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ weeklyEntryId, title }: { weeklyEntryId: string; title: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('mini_moves')
        .insert({
          weekly_entry_id: weeklyEntryId,
          user_id: user.id,
          title,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['miniMoves', variables.weeklyEntryId] });
    },
  });
}

export function useToggleMiniMove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, completed, weeklyEntryId }: { id: string; completed: boolean; weeklyEntryId: string }) => {
      const { error } = await supabase
        .from('mini_moves')
        .update({ completed })
        .eq('id', id);

      if (error) throw error;
      return { weeklyEntryId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['miniMoves', data.weeklyEntryId] });
    },
  });
}

export function useDeleteMiniMove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, weeklyEntryId }: { id: string; weeklyEntryId: string }) => {
      const { error } = await supabase
        .from('mini_moves')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { weeklyEntryId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['miniMoves', data.weeklyEntryId] });
    },
  });
}
